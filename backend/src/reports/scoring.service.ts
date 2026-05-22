import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Report, ReportGrade } from "./report.entity";
import { ReportSuspect } from "./report-suspect.entity";

@Injectable()
export class ScoringService {
  constructor(
    @InjectRepository(Report) private reportsRepository: Repository<Report>,
    @InjectRepository(ReportSuspect)
    private suspectsRepository: Repository<ReportSuspect>,
  ) {}

  private scoreType(type: string): number {
    const t = type.toLowerCase();
    if (t.includes("physique") || t.includes("sexuel")) return 25;
    if (t.includes("cyber")) return 15;
    if (t.includes("verbal")) return 10;
    if (t.includes("exclusion")) return 5;
    return 5;
  }

  private scoreFrequency(frequency: string): number {
    const f = frequency.toLowerCase();
    if (f.includes("tous les jours")) return 20;
    if (f.includes("trois fois ou plus")) return 12;
    if (f.includes("deux fois")) return 6;
    if (f.includes("une fois")) return 2;
    return 2;
  }

  private scoreClass(schoolClass: string): number {
    if (!schoolClass) return 5;
    const c = schoolClass.toLowerCase();
    if (c.includes("6")) return 8;
    if (c.includes("5")) return 7;
    if (c.includes("4")) return 6;
    if (c.includes("3")) return 5;
    return 5;
  }

  private async scoreRecidive(
    suspects: { userId?: string; freeText?: string }[],
  ): Promise<number> {
    if (!suspects || suspects.length === 0) return 0;
    let maxCount = 0;
    for (const suspect of suspects) {
      let count = 0;
      if (suspect.userId) {
        count = await this.suspectsRepository.count({
          where: { user: { id: suspect.userId } },
        });
      } else if (suspect.freeText) {
        count = await this.suspectsRepository.count({
          where: { freeText: suspect.freeText },
        });
      }
      if (count > maxCount) maxCount = count;
    }
    if (maxCount >= 3) return 20;
    if (maxCount === 2) return 12;
    if (maxCount === 1) return 6;
    return 0;
  }

  private scoreAIFallback(description: string): {
    score: number;
    urgency: boolean;
    reason: string;
  } {
    const text = description.toLowerCase();
    if (
      text.includes("suicid") ||
      text.includes("me tuer") ||
      text.includes("mourir") ||
      text.includes("menace") ||
      text.includes("frapper") ||
      text.includes("tuer")
    ) {
      return {
        score: 20,
        urgency: true,
        reason: "Menace physique ou idées suicidaires détectées",
      };
    }
    if (
      text.includes("peur") ||
      text.includes("aide") ||
      text.includes("souffre") ||
      text.includes("pleure") ||
      text.includes("seul") ||
      text.includes("malheureux")
    ) {
      return {
        score: 10,
        urgency: false,
        reason: "Détresse émotionnelle détectée",
      };
    }
    if (
      text.includes("insulte") ||
      text.includes("menace verbale") ||
      text.includes("crier") ||
      text.includes("humili")
    ) {
      return { score: 5, urgency: false, reason: "Menace verbale détectée" };
    }
    return { score: 0, urgency: false, reason: "Situation banale" };
  }

  private async scoreAIGroq(
    description: string,
  ): Promise<{ score: number; urgency: boolean; reason: string }> {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || process.env.AI_ENABLED !== "true") {
      return this.scoreAIFallback(description);
    }
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            max_tokens: 100,
            messages: [
              {
                role: "user",
                content: `Analyse ce signalement de harcèlement scolaire et réponds UNIQUEMENT avec un JSON :
{"score": 0|5|10|20, "urgency": true|false, "reason": "courte explication"}

Règles :
- score 20 + urgency true = menace physique ou idées suicidaires
- score 10 = détresse émotionnelle
- score 5 = menace verbale
- score 0 = situation banale

Signalement : "${description}"`,
              },
            ],
          }),
        },
      );
      const data = await response.json();
      const text = data.choices[0].message.content.trim();
      const parsed = JSON.parse(text);
      return {
        score: parsed.score ?? 0,
        urgency: parsed.urgency ?? false,
        reason: parsed.reason ?? "",
      };
    } catch {
      return this.scoreAIFallback(description);
    }
  }

  async calculateScore(
    title: string,
    description: string,
    frequency: string,
    schoolClass: string,
    suspects: { userId?: string; freeText?: string }[],
  ): Promise<{
    finalScore: number;
    grade: ReportGrade;
    aiScore: number;
    aiReason: string;
  }> {
    const typeScore = this.scoreType(title);
    const frequencyScore = this.scoreFrequency(frequency);
    const classScore = this.scoreClass(schoolClass);
    const recidiveScore = await this.scoreRecidive(suspects);
    const baseScore = typeScore + frequencyScore + classScore + recidiveScore;

    const {
      score: aiScore,
      urgency,
      reason: aiReason,
    } = await this.scoreAIGroq(description);
    let finalScore = Math.min(baseScore + aiScore, 100);
    if (urgency) finalScore = Math.max(finalScore, 60);

    let grade: ReportGrade;
    if (finalScore >= 60) grade = ReportGrade.CRITICAL;
    else if (finalScore >= 40) grade = ReportGrade.HIGH;
    else if (finalScore >= 20) grade = ReportGrade.MEDIUM;
    else grade = ReportGrade.LOW;

    return { finalScore, grade, aiScore, aiReason };
  }
}
