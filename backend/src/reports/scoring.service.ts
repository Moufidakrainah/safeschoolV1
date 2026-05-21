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
    suspects: { freeText: string }[],
  ): Promise<number> {
    if (!suspects || suspects.length === 0) return 0;
    let maxCount = 0;
    for (const suspect of suspects) {
      let count = 0;
      if (suspect.freeText) {
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
    const match = (patterns: RegExp[]) => patterns.some(p => p.test(text));

    // ── Urgence : violence physique ou idées suicidaires ──────────────────
    const urgencePatterns = [
      // Idées suicidaires
      /suicid/,
      /me tuer|envie de mourir|veux mourir|veut mourir/,
      /mourir|la mort|en finir/,
      /plus vivre|plus envie de vivre/,

      // Violence physique
      /frapp/,            // frappe, frapper, frappé, frappée, frappent
      /cogn/,             // cogner, cogné
      /coup[s ]|coup$/,   // coup, coups
      /battre|me bat |me batt/,
      /bless/,            // blesser, blessé
      /agress/,           // agresser, agression
      /violen/,           // violence, violent
      /attaqu/,           // attaquer, attaque
      /pouss/,            // pousser, poussé, pousse
      /gifle|giffl/,      // gifle, giflé
      /étrangl/,          // étrangler
      /crach/,            // cracher, craché

      // Menaces graves
      /menaç|je vais te/,
      /te tuer|te frapper|te casser/,
      /si tu parles|si tu le dis/,

      // Harcèlement sexuel
      /touch.*corps|corps.*touch/,
      /geste déplacé|remarque.*corps/,
      /harcèlement sexuel|agression sexuelle/,
    ];

    // ── Détresse émotionnelle ─────────────────────────────────────────────
    const detressePatterns = [
      // Peur et anxiété
      /\bpeur\b|apeur/,
      /anxieu|angoiss/,
      /stressé|stress/,
      /tremble|trembl/,

      // Tristesse et isolement
      /pleur/,            // pleurer, pleure, pleuré
      /triste|tristesse/,
      /déprim|dépress/,
      /malheur/,
      /souffr/,
      /\bseul[e ]?\b|isolé|mis à l.écart/,
      /personne ne m.aime|personne ne me parle/,

      // Mal-être scolaire
      /plus envie d.aller|peur d.aller|j.ose pas aller/,
      /mal à l.aise|pas bien|très mal/,
      /honte/,
      /plus dormir|ne dors plus|cauchemar/,
      /ne mange plus|ne mange pas/,

      // Demande d.aide
      /aidez.moi|besoin d.aide|au secours/,
      /\baide\b/,
    ];

    // ── Menace verbale ────────────────────────────────────────────────────
    const verbalePatterns = [
      // Insultes
      /insult/,
      /traite.*nom|noms|tous les noms/,
      /gros mot|grossièreté/,
      /racis|racist|discrimin/,
      /moque|rigoler de moi|rient de moi/,

      // Humiliation
      /humili/,
      /ridiculis|se fout de moi/,
      /surnom|appell.*méchant/,
      /imit/,             // imiter, imitation

      // Menace verbale
      /menace verbal|crier|hurler/,
      /réputation|répand.*rumeur|rumeur/,
      /dit.*mensonge|ment sur moi/,
    ];

    // ── Exclusion sociale ─────────────────────────────────────────────────
    const exclusionPatterns = [
      /refuse.*s.asseoir|ne veut pas.*asseoir/,
      /exclure|exclu[e ]|mis à l.écart/,
      /personne ne me parle|plus personne/,
      /seul.*cantine|mange seul/,
      /groupe.*travail|refus.*groupe/,
      /ignor/,            // ignorer, ignoré
      /ostracis/,
    ];

    if (match(urgencePatterns)) {
      return { score: 20, urgency: true,  reason: "Menace physique / idées suicidaires détectées" };
    }
    if (match(detressePatterns)) {
      return { score: 10, urgency: false, reason: "Détresse émotionnelle détectée" };
    }
    if (match(verbalePatterns)) {
      return { score: 5,  urgency: false, reason: "Menace verbale détectée" };
    }
    if (match(exclusionPatterns)) {
      return { score: 3,  urgency: false, reason: "Exclusion sociale détectée" };
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
      const jsonMatch = text.match(/{[\s\S]*?}/);
      const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      return {
        score: parsed.score ?? 0,
        urgency: parsed.urgency ?? false,
        reason: parsed.reason ?? "",
      };
    } catch (err) {
      return this.scoreAIFallback(description);
    }
  }

  async calculateScore(
    title: string,
    description: string,
    frequency: string,
    schoolClass: string,
    suspects: { freeText: string }[],
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
    if (finalScore >= 60) grade = ReportGrade.CRITIQUE;
    else if (finalScore >= 40) grade = ReportGrade.GRAVE;
    else if (finalScore >= 20) grade = ReportGrade.MOYEN;
    else grade = ReportGrade.FAIBLE;

    return { finalScore, grade, aiScore, aiReason };
  }
}
