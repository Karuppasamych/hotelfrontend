import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Lock, Mail, Utensils, ChefHat, Wine, Hotel } from "lucide-react";
import hotelLogo from '../../../assets/MPH_AI_logo.png'
import hotelWhiteLogo from '../../../assets/MPH_Logo_White.png'
export function SignInScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const success = await login(username, password);
    if (success) {
      navigate("/inventory");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Classy Restaurant Design */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-amber-900 via-orange-800 to-red-900 overflow-hidden">
        {/* Decorative Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)`
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          {/* Logo */}
          <div className="mb-12">
            <img 
              src={hotelWhiteLogo} 
              alt="Madurai Pandiyan Hotel Logo" 
              className="w-40 h-40 object-contain drop-shadow-2xl"
            />
          </div>

          {/* Decorative Icons */}
          <div className="flex gap-12 mb-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
                <Utensils className="w-10 h-10" />
              </div>
              <span className="text-white/90">Fine Dining</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
                <ChefHat className="w-10 h-10" />
              </div>
              <span className="text-white/90">Expert Chefs</span>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
                <Wine className="w-10 h-10" />
              </div>
              <span className="text-white/90">Premium Service</span>
            </div>
          </div>

          {/* Text Content */}
          <div className="text-center max-w-md">
            <h2 className="mb-4 text-white">Madurai Pandiyan Hotel</h2>
            <p className="text-white/90 mb-8">
              Experience the authentic flavors of South India with our traditional recipes passed down through generations
            </p>
            <div className="space-y-3 text-white/80">
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-0.5 bg-white/30" />
                <span>Authentic South Indian Cuisine</span>
                <div className="w-12 h-0.5 bg-white/30" />
              </div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-12 h-0.5 bg-white/30" />
                <span>Since 1985</span>
                <div className="w-12 h-0.5 bg-white/30" />
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Corner Elements */}
        <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-white/20" />
        <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-white/20" />
      </div>

      {/* Right side - Sign In Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Hotel Logo/Brand */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img 
                src={hotelLogo} 
                alt="Madurai Pandiyan Hotel Logo" 
                className="w-24 h-24 object-contain"
              />
            </div>
            <h1 className="text-gray-900 mb-2">Madurai Pandiyan Hotel</h1>
            <p className="text-gray-600">Management System</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access the management dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e:any) => setUsername(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      className="text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e:any) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Sign In
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Don't have an account?{" "}
                  <button className="text-blue-600 hover:text-blue-700 transition-colors">
                    Contact Administrator
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-gray-500 mt-8">
            © 2026 Madurai Pandiyan Hotel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}