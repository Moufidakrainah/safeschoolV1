interface StepBarProps {
  steps: string[];
  currentStep: number;
}

export default function StepBar({ steps, currentStep }: StepBarProps) {
  return (
    <div className="w-full" role="progressbar">
      <div className="flex flex-col md:flex-row gap-3 md:gap-2">
        {steps.map((s, i) => (
          <div key={s} className="w-full  md:flex-1 text-center">
            <div
              className={`text-[10px] sm:text-xs ${
                currentStep === i + 1
                  ? "font-bold text-primary"
                  : currentStep > i + 1
                    ? "text-low"
                    : "text-gray-300"
              }`}
            >
              {s}
            </div>
            <div
              className={`h-1 mt-1 ${
                currentStep > i + 1
                  ? "bg-low"
                  : currentStep === i + 1
                    ? "bg-primary"
                    : "bg-gray-200"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
