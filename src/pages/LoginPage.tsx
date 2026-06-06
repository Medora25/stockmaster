import React, { useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Package, LockKeyhole, Mail, User as UserIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export const LoginPage: React.FC = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = useMemo(() => {
    return location.state?.from?.pathname || '/';
  }, [location.state]);

  if (!loading && user) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        toast({ title: 'Connexion réussie' });
        navigate(redirectTo, { replace: true });
      } else {
        await signUp(email, password, name);
        toast({
          title: 'Compte créé',
          description: "Si la confirmation d'e-mail est activée, validez votre adresse puis connectez-vous.",
        });
        setMode('login');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Une erreur inattendue est survenue';
      toast({
        title: mode === 'login' ? 'Échec de connexion' : "Échec de création du compte",
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <CardTitle className="text-center">
            {mode === 'login' ? 'Connexion' : 'Créer un compte'}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'login'
              ? 'Saisissez vos identifiants pour acceder a l’application'
              : 'Creez un compte pour commencer a utiliser l’application'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="pl-9"
                    placeholder="Nom complet"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="pl-9"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <LockKeyhole className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="pl-9"
                  placeholder="********"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting
                ? 'Traitement en cours...'
                : mode === 'login'
                  ? 'Se connecter'
                  : 'Creer le compte'}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setMode((current) => (current === 'login' ? 'signup' : 'login'))}
            >
              {mode === 'login' ? "Vous n'avez pas de compte ? Creer un compte" : 'Vous avez deja un compte ? Se connecter'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
