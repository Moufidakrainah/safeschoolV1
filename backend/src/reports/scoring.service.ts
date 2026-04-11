import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportGrade } from './report.entity';

@Injectable()
export class ScoringService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
  ) {}

  // Score basé sur le type de harcèlement
  private scoreType(type: string): number {
    const t = type.toLowerCase();
    if (t.includes('physique') || t.includes('sexuel')) return 30;
    if (t.includes('cyber')) return 20;
    if (t.includes('verbal')) return 15;
    if (t.includes('exclusion')) return 10;
    return 10;
  }

  // Score basé sur la fréquence
  private scoreFrequency(frequency: string): number {
    if (frequency.includes('tous les jours')) return 20;
    if (frequency.includes('trois fois ou plus')) return 15;
    if (frequency.includes('deux fois')) return 10;
    if (frequency.includes('une fois')) return 5;
    return 5;
  }

  // Score basé sur la classe de la victime
  private scoreClass(schoolClass: string): number {
    if (!schoolClass) return 10;
    const c = schoolClass.toLowerCase();
    if (c.includes('6')) return 15;
    if (c.includes('5')) return 12;
    if (c.includes('4')) return 10;
    if (c.includes('3')) return 8;
    return 10;
  }

  // Score basé sur la récidive
  private async scoreRecidive(studentId: string): Promise<number> {
    if (!studentId) return 0;
    const count = await this.reportsRepository.count({
      where: { student: { id: studentId } },
    });
    if (count >= 3) return 25;
    if (count === 2) return 18;
    if (count === 1) return 12;
    return 0;
  }

  // Score IA par mots-clés (fallback si Groq indisponible)
  private scoreAIFallback(description: string): { score: number; urgency: boolean; reason: string } {
    const text = description.toLowerCase();
    
    if (
      text.includes('suicid') || text.includes('me tuer') ||
      text.includes('mourir') || text.includes('menace') ||
      text.includes('frapper') || text.includes('tuer')
    ) {
      return { score: 20, urgency: true, reason: 'Menace physique ou idées suicidaires détectées' };
    }
    if (
      text.includes('peur') || text.includes('aide') ||
      text.includes('souffre') || text.includes('pleure') ||
      text.includes('seul') || text.includes('malheureux')
    ) {
      return { score: 10, urgency: false, reason: 'Détresse émotionnelle détectée' };
    }
    if (
      text.includes('insulte') || text.includes('menace verbale') ||
      text.includes('crier') || text.includes('humili')
    ) {
      return { score: 5, urgency: false, reason: 'Menace verbale détectée' };
    }
    return { score: 0, urgency: false, reason: 'Situation banale' };
  }

 // Score IA via Groq
private async scoreAIGroq(description: string): Promise<{ score: number; urgency: boolean; reason: string }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || process.env.AI_ENABLED !== 'true') {
    console.log('Groq désactivé — fallback mots-clés');
    return this.scoreAIFallback(description);
  }

  try {
    console.log('Appel Groq en cours...');
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: `Analyse ce signalement de harcèlement scolaire et réponds UNIQUEMENT avec un JSON :
{"score": 0|5|10|20, "urgency": true|false, "reason": "courte explication"}

Règles :
- score 20 + urgency true = menace physique ou idées suicidaires
- score 10 = détresse émotionnelle
- score 5 = menace verbale
- score 0 = situation banale

Signalement : "${description}"`,
        }],
      }),
    });

    console.log('Groq status:', response.status);
    const data = await response.json();
    console.log('Groq response:', JSON.stringify(data));

    const text = data.choices[0].message.content.trim();
    const parsed = JSON.parse(text);
    return {
      score: parsed.score ?? 0,
      urgency: parsed.urgency ?? false,
      reason: parsed.reason ?? '',
    };
  } catch (error) {
    console.error('Erreur Groq:', error);
    return this.scoreAIFallback(description);
  }
}

  // Calcul du score final
  async calculateScore(
    title: string,
    description: string,
    frequency: string,
    schoolClass: string,
    studentId: string,
  ): Promise<{ finalScore: number; grade: ReportGrade; aiScore: number; aiReason: string }> {

    // Score de base
    const typeScore      = this.scoreType(title);
    const frequencyScore = this.scoreFrequency(frequency);
    const classScore     = this.scoreClass(schoolClass);
    const recidiveScore  = await this.scoreRecidive(studentId);
    const preuveScore    = 0; // pas encore implémenté

    const baseScore = typeScore + frequencyScore + classScore + recidiveScore + preuveScore;

    // Score IA
    const { score: aiScore, urgency, reason: aiReason } = await this.scoreAIGroq(description);

    // Score final plafonné à 100
    let finalScore = Math.min(baseScore + aiScore, 100);

    // Si urgence détectée → score minimum 60
    if (urgency) finalScore = Math.max(finalScore, 60);

    // Déterminer le grade
    let grade: ReportGrade;
    if (finalScore >= 60) grade = ReportGrade.CRITICAL;
    else if (finalScore >= 40) grade = ReportGrade.URGENT;
    else if (finalScore >= 20) grade = ReportGrade.SERIOUS;
    else grade = ReportGrade.WATCH;

    return { finalScore, grade, aiScore, aiReason };
  }
}