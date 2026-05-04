/*@query -> recherche,filtre, pagination (cle = valeur) 
@param -> id dans l'url GET /users/123 
@body  -> donnees envoyees Post /users  -> body en JSON 
{
  "email" : "lotfi@safeschool.com",
  "password" : "1234"
}
@Request -> toute la requete
req = {
  user: { id: 1, role: "admin" },
  headers: {...},
  body: {...},
  query: {...}
} */
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { validateUUID } from '../utils/validate-uuid';

// Toutes les routes commencent par /users
// Toutes protégées par JWT — impossible d'accéder sans token valide
@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /users/search?q=valeur
  // Recherche un user par prénom ou nom
  // Accessible à tous les connectés
  // Exemple : GET /users/search?q=lotfi
  /*# Rechercher par prénom
  curl -X GET "http://localhost:5000/users/search?q=lotfi" \
  -H "Authorization: Bearer TON_TOKEN"

  # Rechercher par nom
  curl -X GET "http://localhost:5000/users/search?q=bougrine" \
  -H "Authorization: Bearer TON_TOKEN"

  # Recherche trop courte → retourne []
  curl -X GET "http://localhost:5000/users/search?q=l" \
  -H "Authorization: Bearer TON_TOKEN" */
  @Get('search')
  async search(@Query('q') q: string) {
    if (!q || q.length < 2) return [];
    return this.usersService.search(q);
  }

  // GET /users
  // GET /users?role=student
  // GET /users?page=1&limit=5
  // GET /users?role=teacher&page=1&limit=10
  // Accessible uniquement à l'admin et au directeur
  /*# Tous les utilisateurs
  curl -X GET "http://localhost:5000/users" \
    -H "Authorization: Bearer TON_TOKEN"

  # Filtrer par rôle
  curl -X GET "http://localhost:5000/users?role=student" \
    -H "Authorization: Bearer TON_TOKEN"

  curl -X GET "http://localhost:5000/users?role=teacher" \
    -H "Authorization: Bearer TON_TOKEN"

  # Pagination
  curl -X GET "http://localhost:5000/users?page=1&limit=5" \
    -H "Authorization: Bearer TON_TOKEN"

  curl -X GET "http://localhost:5000/users?page=2&limit=5" \
    -H "Authorization: Bearer TON_TOKEN"

  # Filtre + pagination
  curl -X GET "http://localhost:5000/users?role=student&page=1&limit=3" \
    -H "Authorization: Bearer TON_TOKEN"

  # Test accès refusé — avec token directeur
  curl -X GET "http://localhost:5000/users" \
    -H "Authorization: Bearer TOKEN_DIRECTEUR" */
  @Get()
  async findAll(
    @Request() req,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (req.user.role !== 'admin' && req.user.role !== 'director') {
      throw new ForbiddenException('Accès refusé');
    }
    const pageNum  = page  ? parseInt(page)  : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.usersService.findAll(role, pageNum, limitNum);
  }

  // GET /users/:id
  // Voir un user spécifique par son ID
  // Accessible à : admin, director, ou l'utilisateur lui-même
  // Exemple : GET /users/a0b1c2d3-0000-0000-0000-000000000006
  /*# Voir un user par ID
  curl -X GET "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000006" \
    -H "Authorization: Bearer TON_TOKEN"

  # Test accès refusé — un élève essaie de voir un autre élève
  curl -X GET "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000007" \
    -H "Authorization: Bearer TOKEN_LOTFI"

  # UUID invalide → erreur 400
  curl -X GET "http://localhost:5000/users/invalid-id" \
    -H "Authorization: Bearer TON_TOKEN" */
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    validateUUID(id);
    if (req.user.role !== 'admin' && req.user.role !== 'director' && req.user.id !== id) {
      throw new ForbiddenException('Accès refusé');
    }
    return this.usersService.findById(id);
  }

  // POST /users
  // Crée un nouvel utilisateur
  // Accessible uniquement à l'admin
  // Body : { email, password, firstName, lastName, role, schoolClass? }
  /*# Créer un élève
  curl -X POST "http://localhost:5000/users" \
    -H "Authorization: Bearer TON_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "nouveau@safeschool.com",
      "password": "eleve123",
      "firstName": "Nouveau",
      "lastName": "Eleve",
      "role": "student",
      "schoolClass": "5eme"
    }'

  # Créer un enseignant
  curl -X POST "http://localhost:5000/users" \
    -H "Authorization: Bearer TON_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "prof3@safeschool.com",
      "password": "prof123",
      "firstName": "Jean",
      "lastName": "Dupont",
      "role": "teacher"
    }'

  # Test email déjà utilisé → erreur 409
  curl -X POST "http://localhost:5000/users" \
    -H "Authorization: Bearer TON_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "admin@safeschool.com",
      "password": "test123",
      "firstName": "Test",
      "lastName": "Test",
      "role": "admin"
    }'

  # Test accès refusé — directeur essaie de créer
  curl -X POST "http://localhost:5000/users" \
    -H "Authorization: Bearer TOKEN_DIRECTEUR" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@safeschool.com",
      "password": "test123",
      "firstName": "Test",
      "lastName": "Test",
      "role": "student"
    }' */
  @Post()
  async createUser(
    @Request() req,
    @Body() dto: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: string;
      schoolClass?: string;
    },
  ) {
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Seul l\'admin peut créer des utilisateurs');
    }
    return this.usersService.createByAdmin(dto);
  }

  // PATCH /users/:id
  // Modifie un utilisateur existant
  // Accessible uniquement à l'admin
  // Tous les champs sont optionnels
  // Exemple : PATCH /users/a0b1c2d3-0000-0000-0000-000000000006
  // Body : { "firstName": "NouveauPrenom", "email": "nouveau@email.com" }
  /*# Modifier le prénom
curl -X PATCH "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000006" \
  -H "Authorization: Bearer TON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "NouveauPrenom"}'

# Modifier l'email
curl -X PATCH "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000006" \
  -H "Authorization: Bearer TON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "nouveau@safeschool.com"}'

# Modifier la classe d'un élève
curl -X PATCH "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000006" \
  -H "Authorization: Bearer TON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"schoolClass": "6eme"}'

# Modifier plusieurs champs
curl -X PATCH "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000006" \
  -H "Authorization: Bearer TON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Nouveau",
    "lastName": "Nom",
    "role": "teacher"
  }'

# Test email déjà pris → erreur 409
curl -X PATCH "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000006" \
  -H "Authorization: Bearer TON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@safeschool.com"}'

# Test accès refusé — directeur essaie de modifier
curl -X PATCH "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000006" \
  -H "Authorization: Bearer TOKEN_DIRECTEUR" \
  -H "Content-Type: application/json" \
  -d '{"firstName": "Test"}' */
  @Patch(':id')
  async updateUser(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: {
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      schoolClass?: string;
    },
  ) {
    validateUUID(id);
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Seul l\'admin peut modifier des utilisateurs');
    }
    return this.usersService.updateByAdmin(id, dto);
  }

  // PATCH /users/:id/password
  // Change le mot de passe d'un utilisateur
  // Accessible à : admin (n'importe quel user) ou l'utilisateur lui-même
  // Body : { "password": "nouveauMotDePasse" }
  /* # Admin change le mot de passe de n'importe qui
curl -X PATCH "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000006/password" \
  -H "Authorization: Bearer TON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "nouveauMotDePasse"}'

# Un élève change son propre mot de passe
curl -X PATCH "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000006/password" \
  -H "Authorization: Bearer TOKEN_LOTFI" \
  -H "Content-Type: application/json" \
  -d '{"password": "monNouveauMdp"}'

# Test mot de passe trop court → erreur 403
curl -X PATCH "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000006/password" \
  -H "Authorization: Bearer TON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"password": "123"}'

# Test accès refusé — un élève essaie de changer le mot de passe d'un autre
curl -X PATCH "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000007/password" \
  -H "Authorization: Bearer TOKEN_LOTFI" \
  -H "Content-Type: application/json" \
  -d '{"password": "hackedPassword"}' */
  @Patch(':id/password')
  async changePassword(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: { password: string },
  ) {
    validateUUID(id);
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new ForbiddenException('Accès refusé');
    }
    return this.usersService.changePassword(id, dto.password);
  }

  // DELETE /users/:id
  // Supprime un utilisateur et toutes ses données
  // Accessible uniquement à l'admin
  // Impossible de supprimer son propre compte
  /*# Supprimer un utilisateur
curl -X DELETE "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000006" \
  -H "Authorization: Bearer TON_TOKEN"

# Test auto-suppression → erreur 403
curl -X DELETE "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000001" \
  -H "Authorization: Bearer TON_TOKEN"

# Test accès refusé — directeur essaie de supprimer
curl -X DELETE "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000006" \
  -H "Authorization: Bearer TOKEN_DIRECTEUR"

# Test sans token → erreur 401
curl -X DELETE "http://localhost:5000/users/a0b1c2d3-0000-0000-0000-000000000006" */
  @Delete(':id')
  async deleteUser(@Request() req, @Param('id') id: string) {
    validateUUID(id);
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Seul l\'admin peut supprimer des utilisateurs');
    }
    return this.usersService.deleteByAdmin(id, req.user.id);
  }
  /*# Token directeur
curl -X POST "http://localhost:5000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "directeur@safeschool.com", "password": "directeur123"}'

# Token lotfi (élève)
curl -X POST "http://localhost:5000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "lotfi@safeschool.com", "password": "eleve123"}' */
}