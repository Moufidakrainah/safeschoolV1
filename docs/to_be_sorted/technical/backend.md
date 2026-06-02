Explication du projet Safeschool — Backend NestJS
1. La structure générale : NestJS, c'est quoi ?
NestJS est un framework backend en TypeScript qui s'inspire d'Angular. Il impose une architecture très stricte basée sur des modules. Chaque fonctionnalité de l'application est découpée en module, et chaque module contient toujours les mêmes types de fichiers :
monModule/
  ├── mon-module.module.ts      → le "registre" du module
  ├── mon-module.controller.ts  → gère les routes HTTP
  ├── mon-module.service.ts     → contient la logique métier
  └── mon-entite.entity.ts      → décrit la table en base de données

  2. Les fichiers générés automatiquement vs écrits à la main
🤖 Générés automatiquement par les outils
backend/dist
backend/node_modules
backend/package-lock.json
tsconfig.build.tsbuildinfo
next-cli.json
tsconfig.json
tsconfig.build.json
eslint.config.mjs

✍️ Écrits par un humain (vous)
Tout ce qui est dans backend/src/ — chaque ligne a été rédigée manuellement.


3. Le point d'entrée : main.ts
main.ts → bootstrap() → démarre le serveur
C'est le premier fichier exécuté. Il fait trois choses :
a) Créer l'application NestJS
tsconst app = await NestFactory.create<NestExpressApplication>(AppModule);
NestFactory est fourni par NestJS. Tu lui passes AppModule qui est la racine de toute l'application.
b) Configurer le CORS
tsapp.enableCors({ origin: "http://localhost:5173", ... })
Le CORS (Cross-Origin Resource Sharing) est une sécurité du navigateur. Sans ça, le frontend (port 5173) ne pourrait pas appeler le backend (port 3000) car ils sont sur des ports différents. On autorise explicitement cette communication.
c) Servir les fichiers statiques (avatars)
tsapp.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' })
Quand un utilisateur uploade un avatar, le fichier est sauvegardé dans backend/uploads/avatars/. Cette ligne dit au serveur : "si quelqu'un appelle /uploads/avatars/monfichier.jpg, renvoie le fichier depuis le disque directement". C'est ce qui permet d'afficher les photos de profil.

4. Le module racine : app.module.ts
C'est le chef d'orchestre. Il importe et connecte tous les autres modules ensemble. Deux choses importantes s'y passent :
La connexion à la base de données (TypeORM)
tsTypeOrmModule.forRoot({
  type: "postgres",
  entities: [__dirname + "/**/*.entity{.ts,.js}"],
  synchronize: true,
})

TypeORM est un ORM (Object-Relational Mapper) : il fait le lien entre tes classes TypeScript et tes tables PostgreSQL.
entities: [__dirname + "/**/*.entity{.ts,.js}"] — NestJS scanne automatiquement tous les fichiers qui se terminent par .entity.ts et crée les tables correspondantes.
synchronize: true — dangereux en production : à chaque démarrage, TypeORM compare les entités avec la vraie base et applique les changements automatiquement (ajout de colonnes, etc.).

Le middleware global de logging
tsexport class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes("*");
  }
}
Chaque requête HTTP qui arrive passe d'abord par HttpLoggerMiddleware avant d'atteindre n'importe quel controller. C'est ici que les logs sont envoyés à Logstash (ELK).

5. L'authentification : le flux complet
user.entity.ts — La table users
ts@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ unique: true }) email: string;
  @Column({ select: false }) password: string;
  @Column({ type: "enum", enum: UserRole }) role: UserRole;
  ...
}
Chaque décorateur @Column, @Entity, etc. vient de TypeORM et génère automatiquement le SQL correspondant. Points notables :

@PrimaryGeneratedColumn("uuid") → TypeORM génère un UUID aléatoire à chaque création d'utilisateur, jamais toi.
{ select: false } sur password → même si tu fais SELECT *, le mot de passe n'est pas retourné. C'est une sécurité TypeORM native.
UserRole est une enum TypeScript qui devient une enum PostgreSQL en base.
Les @OneToOne et @OneToMany définissent les relations entre tables (un user a un profil élève, un user a plusieurs signalements).

auth.service.ts — La logique de connexion
Le flux de login est :
POST /auth/login
  → AuthController.login()
  → AuthService.login()
    → UsersService.findByEmailWithProfile()   ← cherche le user en BDD
    → bcrypt.compare(password, hash)          ← vérifie le mot de passe
    → jwtService.sign(payload)                ← génère le token JWT
  ← retourne { access_token, user }
bcrypt est une librairie de hashage. Les mots de passe ne sont jamais stockés en clair — lors de l'inscription bcrypt.hash() génère un hash, et lors de la connexion bcrypt.compare() compare le mot de passe tapé avec le hash stocké.
Le JWT (JSON Web Token) est un token signé avec JWT_SECRET (variable d'environnement). Il contient { sub: userId, email, role }. Une fois signé, il est envoyé au frontend qui le stocke et le renvoie dans chaque requête dans le header Authorization: Bearer <token>.
jwt.strategy.ts — La vérification du token
tsexport class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload) {
    return this.usersService.findById(payload.sub);
  }
}
C'est le gardien. À chaque requête protégée :

NestJS lit le header Authorization: Bearer <token>
Il vérifie la signature avec JWT_SECRET
Il décode le payload { sub, email, role }
Il appelle validate() qui charge le user complet depuis la BDD
Ce user est injecté dans req.user — accessible dans tous les controllers


6. users.service.ts — La logique métier des utilisateurs
C'est le fichier le plus riche. Il illustre bien les patterns utilisés partout dans le projet.
L'injection de dépendances
tsconstructor(
  @InjectRepository(User) private usersRepository: Repository<User>,
  @InjectRepository(StudentProfile) private studentProfileRepository: Repository<StudentProfile>,
  ...
)
@InjectRepository est un décorateur NestJS/TypeORM. Il injecte automatiquement le "repository" TypeORM correspondant à chaque entité. Un repository est un objet qui expose des méthodes pour interagir avec la table : find, save, remove, createQueryBuilder, etc.
Les deux types de requêtes TypeORM
Simple (méthodes built-in) :
tsthis.usersRepository.findOne({ where: { email }, relations: ['studentProfile'] })
Complexe (QueryBuilder) :
tsthis.usersRepository
  .createQueryBuilder("user")
  .leftJoinAndSelect("user.studentProfile", "studentProfile")
  .where("LOWER(user.firstName) LIKE LOWER(:query)", { query: `%${query}%` })
  .limit(5)
  .getMany();
Le QueryBuilder permet d'écrire des requêtes SQL complexes (JOIN, LIKE, filtres) tout en restant en TypeScript.
Le code commenté
Tu remarqueras beaucoup de code commenté dans deleteByAdmin. C'est l'historique des itérations — trois versions successives de la suppression d'utilisateur, chacune plus robuste que la précédente. C'est normal en développement, mais idéalement ça partirait dans Git et serait supprimé du fichier final.

Schéma récapitulatif du flux d'une requête protégée
Client (frontend)
  │  Authorization: Bearer <jwt>
  ▼
HttpLoggerMiddleware      ← log la requête vers Logstash/ELK
  ▼
JwtAuthGuard              ← vérifie le token
  ▼
JwtStrategy.validate()    ← charge le user depuis BDD
  ▼
Controller                ← reçoit req.user injecté
  ▼
Service                   ← logique métier
  ▼
Repository (TypeORM)      ← requête PostgreSQL
  ▼
Base de données