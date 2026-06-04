import { useState, useEffect, useCallback } from 'react';
import { getClasses, createClass, updateClass, deleteClass, getAllUsers } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

//les types
interface SchoolClass {
  id: string;
  level: string;
  section: string;
}
interface StudentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  studentProfile?: {
    schoolClass?: { id: string; level: string; section: string } | null;
  };
}

//Composant principal
export default function AdminClasses() {
  //variables d'etat
  const [classes, setClasses] = useState<SchoolClass[]>([]); 
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState(true); //true pendant le chargement ???
  const [showClassForm, setShowClassForm] = useState(false); //affiche/cache le formulaire
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [classForm, setClassForm] = useState({ level: '', section: '' });
  const [savingClass, setSavingClass] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cls, usr] = await Promise.all([getClasses(), getAllUsers(1, 100)]);
      setClasses(cls);
      const allUsers = Array.isArray(usr) ? usr : Array.isArray(usr?.data) ? usr.data : [];
      setStudents(allUsers.filter((u: any) => u.role === 'student'));
    } catch (e) {
      console.error('Erreur chargement', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const studentsInClass = selectedClass
    ? students.filter(s => s.studentProfile?.schoolClass?.id === selectedClass.id)
    : [];

  const handleSaveClass = async () => {
    if (!classForm.level.trim() || !classForm.section.trim()) return;
    setSavingClass(true);
    try {
      if (editingClass) {
        await updateClass(editingClass.id, classForm.level, classForm.section);
      } else {
        await createClass(classForm.level, classForm.section);
      }
      await fetchAll();
      setShowClassForm(false);
      setEditingClass(null);
      setClassForm({ level: '', section: '' });
    } finally {
      setSavingClass(false);
    }
  };

  const handleDeleteClass = async (cls: SchoolClass) => {
    const count = students.filter(s => s.studentProfile?.schoolClass?.id === cls.id).length;
    if (count > 0) {
      alert(`Impossible de supprimer ${cls.level} ${cls.section} : ${count} élève(s) inscrits. Réassignez-les d'abord.`);
      return;
    }
    if (!confirm(`Supprimer la classe ${cls.level} ${cls.section} ?`)) return;
    await deleteClass(cls.id);
    if (selectedClass?.id === cls.id) setSelectedClass(null);
    await fetchAll();
  };

  const avatarUrl = (s: StudentUser) =>
    s.avatar ? `http://localhost:5000/uploads/avatars/${s.avatar}` : null;

  const initials = (s: StudentUser) =>
    `${s.firstName?.[0] ?? ''}${s.lastName?.[0] ?? ''}`.toUpperCase();

  if (loading) {
    return <p className="text-center py-16 text-gray-400">Chargement...</p>;
  }

  return (
    <section className="flex flex-col gap-4">

      {/*liste des classes */}
      <div className=" flex-shrink-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">Classes</h2>
          <Button size="sm" onClick={() => {
              setShowClassForm(true);
              setEditingClass(null);
              setClassForm({ level: '', section: '' });
            }}
          >+ Ajouter</Button>
        </div>

        {/* Formulaire ajout/modif classe */}
        {showClassForm && (
          <div className="mb-4 border-primary border">
              <h3 className="font-semibold text-sm mb-3">
                {editingClass ? 'Modifier' : 'Nouvelle classe'}
              </h3>
              <div className="flex flex-col gap-2">
                <div>
                  <Label className="text-xs text-gray-600">Niveau</Label>
                  <Input
                    value={classForm.level}
                    onChange={e => setClassForm(p => ({ ...p, level: e.target.value }))}
                    placeholder="ex: 5eme"
                    className="mt-1 h-8 text-sm"
                    maxLength={10}
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Section</Label>
                  <Input
                    value={classForm.section}
                    onChange={e => setClassForm(p => ({ ...p, section: e.target.value }))}
                    placeholder="ex: A"
                    className="mt-1 h-8 text-sm"
                    maxLength={2}
                  />
                </div>
                <div className="flex gap-2 mt-1">
                  <Button
                    size="sm"
                    disabled={!classForm.level.trim() || !classForm.section.trim() || savingClass}
                    onClick={handleSaveClass}
                    className="flex-1"
                  >
                    {savingClass ? '...' : 'Enregistrer'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setShowClassForm(false); setEditingClass(null); }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
          </div>
        )}

        {/* Liste des classes */}
        <div className="flex flex-col gap-2">
          {classes.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">Aucune classe</p>
          )}
          {classes.map(cls => {
            const count = students.filter(
              s => s.studentProfile?.schoolClass?.id === cls.id
            ).length;
            const isSelected = selectedClass?.id === cls.id;

            return (
              <div
                key={cls.id}
                onClick={() => setSelectedClass(isSelected ? null : cls)}
                className={` ${isSelected ? 'bg-primary border-primary shadow-md' : 'bg-white hover:shadow-sm border-gray-200'} `}
              >
                <div className="bg-surface shadow-sm px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className={`font-bold text ${isSelected ? 'text/70' : 'text-gray-800'}`}>
                      {cls.level} {cls.section}
                    </p>
                    <p className={`text-xs mt-0.5 ${isSelected ? 'text/70' : 'text-gray-400'}`}>
                      {count} élève{count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="default" onClick={() => {
                        setEditingClass(cls);
                        setClassForm({ level: cls.level, section: cls.section });
                        setShowClassForm(true);
                      }} >Modifier</Button>
                    <Button size="sm" variant="default" onClick={() => handleDeleteClass(cls)}
                    >Supprimer </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* élèves de la classe */}
      <div className="flex-1 min-w-0">
        {!selectedClass ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-300">
            <p className="text-sm">Cliquez sur une classe pour voir ses élèves</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedClass.level} {selectedClass.section}
              </h2>
              <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {studentsInClass.length} élève{studentsInClass.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="bg-surface shadow-sm rounded-sm px-6 py-4">
              <p className="text font-semibold text-gray-700 mb-3">Élèves inscrits</p>
                {studentsInClass.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">
                    Aucun élève dans cette classe.<br />
                    <span className="text-xs">Assignez des élèves depuis la section Utilisateurs.</span>
                  </p>
                ) : (
                  <ul className="flex flex-col divide-y divide-gray-50">
                    {studentsInClass.map(s => (
                      <li key={s.id} className="flex items-center gap-3 py-3">
                        {avatarUrl(s) ? (
                          <img
                            src={avatarUrl(s)!}
                            alt={s.firstName}
                            className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">
                            {initials(s)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">
                            {s.firstName} {s.lastName}
                          </p>
                          <p className="text text-gray-400 truncate">{s.email}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
            </div>
          </>
        )}
      </div>

    </section>
  );
}