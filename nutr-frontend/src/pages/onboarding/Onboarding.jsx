import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/auth.service';
import { auth } from '../../firebase/config';
import { Leaf, Building2, User, ChevronRight, ChevronLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';

const STEPS_INSTITUTION = ['Role', 'Institution Details'];
const STEPS_ELDERLY = ['Role', 'Personal Details'];

export default function Onboarding() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshProfile, logout } = useAuth();

  const [role, setRole] = useState(location.state?.role || '');
  const [step, setStep] = useState(role ? 1 : 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [institutionForm, setInstitutionForm] = useState({ name: '', phone: '', location: '' });
  const [elderlyForm, setElderlyForm] = useState({
    full_name: '', date_of_birth: '', gender: '', phone: '', institution_id: '',
  });

  const steps = role === 'institution' ? STEPS_INSTITUTION : STEPS_ELDERLY;

  const handleRoleSelect = (r) => {
    setRole(r);
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();

      if (role === 'institution') {
        await authService.registerInstitution({
          firebase_token: token,
          email: user.email,
          ...institutionForm,
        });
      } else {
        await authService.registerUser({
          firebase_token: token,
          email: user.email,
          ...elderlyForm,
        });
      }
      await refreshProfile();
      navigate('/verify-email');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 font-bold text-2xl text-primary-800 mb-4">
            <div className="h-10 w-10 bg-primary-800 rounded-xl flex items-center justify-center">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            NutritionX<span className="text-secondary-800">AI</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Complete Your Profile</h1>
          <p className="text-gray-600 text-sm">Step {step + 1} of {steps.length}</p>
          <div className="flex gap-2 justify-center mt-3">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary-800 w-8' : 'bg-gray-200 w-4'}`} />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-4" />}

          {/* Step 0: Role selection */}
          {step === 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Select Account Type</h2>
              <p className="text-sm text-gray-600 mb-6">Choose how you'll be using NutritionX AI.</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'institution', label: 'Care Institution', icon: Building2, desc: 'Manage and monitor elderly residents in your facility' },
                  { value: 'elderly', label: 'Elderly User', icon: User, desc: 'Track your personal health and nutrition data' },
                ].map(({ value, label, icon: Icon, desc }) => (
                  <button
                    key={value}
                    onClick={() => handleRoleSelect(value)}
                    className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-gray-200 hover:border-primary-800 hover:bg-primary-50 transition-all text-center"
                  >
                    <div className="h-12 w-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary-800" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{label}</p>
                      <p className="text-xs text-gray-500 mt-1">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Institution details */}
          {step === 1 && role === 'institution' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Institution Details</h2>
                <p className="text-sm text-gray-600 mb-4">Tell us about your care facility.</p>
              </div>
              <Input label="Institution Name" placeholder="e.g. Sunrise Care Home" required value={institutionForm.name} onChange={(e) => setInstitutionForm({ ...institutionForm, name: e.target.value })} />
              <Input label="Phone Number" type="tel" placeholder="+250 788 000 000" required value={institutionForm.phone} onChange={(e) => setInstitutionForm({ ...institutionForm, phone: e.target.value })} />
              <Input label="Location / Address" placeholder="City, Country" required value={institutionForm.location} onChange={(e) => setInstitutionForm({ ...institutionForm, location: e.target.value })} />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(0)}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  Complete Registration <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 1: Elderly user details */}
          {step === 1 && role === 'elderly' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Personal Details</h2>
                <p className="text-sm text-gray-600 mb-4">Help us personalize your nutrition plan.</p>
              </div>
              <Input label="Full Name" placeholder="Your full name" required value={elderlyForm.full_name} onChange={(e) => setElderlyForm({ ...elderlyForm, full_name: e.target.value })} />
              <Input label="Date of Birth" type="date" required value={elderlyForm.date_of_birth} onChange={(e) => setElderlyForm({ ...elderlyForm, date_of_birth: e.target.value })} hint="We use this to calculate age-specific nutritional needs." />
              <Select label="Gender" required value={elderlyForm.gender} onChange={(e) => setElderlyForm({ ...elderlyForm, gender: e.target.value })} placeholder="Select gender">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other / Prefer not to say</option>
              </Select>
              <Input label="Phone Number" type="tel" placeholder="+250 788 000 000" value={elderlyForm.phone} onChange={(e) => setElderlyForm({ ...elderlyForm, phone: e.target.value })} />
              <Input
                label="Institution ID"
                placeholder="e.g. INST-XXXXXXXX"
                required
                value={elderlyForm.institution_id}
                onChange={(e) => setElderlyForm({ ...elderlyForm, institution_id: e.target.value.toUpperCase() })}
                hint="Get this ID from your care institution administrator."
              />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(0)}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  Complete Registration <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          <div className="mt-4 text-center">
            <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600">
              Cancel and sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
