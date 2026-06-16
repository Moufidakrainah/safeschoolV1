interface StepBarProps {
  steps: string[];
  currentStep: number;
}

export default function StepBar({ steps, currentStep }: StepBarProps) {
  return (
    <div
    className="w-full"
      role="progressbar"
    >
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 text-center">
            <div className={`text-xs font-${currentStep === i + 1 ? 'bold' : 'normal'} ${
              currentStep === i + 1 ? 'text-primary' :
              currentStep > i + 1 ? 'text-low' : 'text-gray-300'
            }`}>
              {s}
            </div>
            <div className={`h-1 mt-1 ${
              currentStep > i + 1 ? 'bg-low' :
              currentStep === i + 1 ? 'bg-primary'   : 'bg-gray-200'
            }`} />
          </div>
        ))}
      </div>
    </div>
  );
}
