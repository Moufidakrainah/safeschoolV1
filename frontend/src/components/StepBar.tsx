interface StepBarProps {
  steps: string[];
  currentStep: number;
}

export default function StepBar({ steps, currentStep }: StepBarProps) {
  return (
    <div
      className="bg-white px-8 py-4 border-b border-gray-100"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-label={`Étape ${currentStep} sur ${steps.length}`}
    >
      <div className="max-w-xl mx-auto flex gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex-1 text-center">
            <div className={`text-xs font-${currentStep === i ? 'bold' : 'normal'} ${
              currentStep === i ? 'text-primary' :
              currentStep > i ? 'text-green-500' : 'text-gray-300'
            }`}>
              {s}
            </div>
            <div className={`h-1 rounded mt-1 ${
              currentStep > i ? 'bg-green-500' :
              currentStep === i ? 'bg-primary'   : 'bg-gray-200'
            }`} />
          </div>
        ))}
      </div>
    </div>
  );
}
