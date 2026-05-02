import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { aiService } from '../../services/ai.service';
import { format, parseISO } from 'date-fns';
import Card from '../../components/ui/Card';
import Badge, { riskBadge } from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

const riskIcon = (risk) => {
  if (risk === 'low') return <TrendingDown className="h-5 w-5 text-green-600" />;
  if (risk === 'high' || risk === 'critical') return <TrendingUp className="h-5 w-5 text-red-600" />;
  return <Minus className="h-5 w-5 text-yellow-600" />;
};

function PredictionCard({ pred }) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {riskIcon(pred.risk_level)}
          <div>
            <p className="font-semibold text-gray-900 capitalize">{pred.prediction_type?.replace(/_/g, ' ')}</p>
            <p className="text-xs text-gray-500">{pred.time_horizon} · {format(parseISO(pred.created_at), 'MMM d, yyyy')}</p>
          </div>
        </div>
        <Badge variant={riskBadge(pred.risk_level)} className="capitalize">{pred.risk_level} Risk</Badge>
      </div>

      {pred.predicted_value !== null && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-0.5">Predicted Value</p>
          <p className="text-xl font-bold text-gray-900">{parseFloat(pred.predicted_value).toFixed(2)}</p>
        </div>
      )}

      {pred.confidence_score !== null && (
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500">Confidence</span>
            <span className="font-medium text-gray-700">{Math.round(parseFloat(pred.confidence_score) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary-800 transition-all"
              style={{ width: `${Math.round(parseFloat(pred.confidence_score) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {pred.description && <p className="text-sm text-gray-700 leading-relaxed">{pred.description}</p>}
    </Card>
  );
}

export default function Predictions() {
  const { data: predictions = [], isLoading } = useQuery({
    queryKey: ['predictions'],
    queryFn: () => aiService.getPredictions().then((r) => r.data),
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Health Predictions</h1>
        <p className="text-sm text-gray-500 mt-1">AI-generated future health insights based on your current trends.</p>
      </div>

      <Card className="bg-secondary-50 border-secondary-100">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-secondary-700 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-secondary-900">
            Predictions are generated weekly every Monday based on your health records, meal logs, and medical conditions. They are estimates to guide your wellness journey, not medical diagnoses.
          </p>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : predictions.length === 0 ? (
        <Card className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No predictions yet.</p>
          <p className="text-sm text-gray-400">Predictions are generated automatically every Monday. Keep logging your health data to receive insights.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {predictions.map((p) => <PredictionCard key={p.id} pred={p} />)}
        </div>
      )}
    </div>
  );
}
