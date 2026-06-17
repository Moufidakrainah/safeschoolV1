import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ParentForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
}

interface ParentFormItemProps {
  parent: ParentForm;
  idx: number;
  onChange: (updated: ParentForm) => void;
  onRemove: () => void;
  dark?: boolean;
}

export default function ParentFormItem({
  parent,
  idx,
  onChange,
  onRemove,
  dark = false,
}: ParentFormItemProps) {
  const { t } = useTranslation();

  // ── Stocke des CLÉS i18n, pas des messages ──
  const [errorKeys, setErrorKeys] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  function validateFieldKey(field: string, value: string): string {
    const nameRegex = /^[a-zA-ZÀ-ÿ'-]{2,20}$/;
    if (field === "firstName") {
      if (!value.trim()) return "admin.users.errorRequired";
      if (!nameRegex.test(value)) return "admin.users.name";
    } else if (field === "lastName") {
      if (!value.trim()) return "admin.users.errorRequired";
      if (!nameRegex.test(value)) return "admin.users.name";
    } else if (field === "email") {
      if (!value.trim()) return "admin.users.errorRequired";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value))
        return "admin.users.errorEmailFormat";
      if (value.length > 50) return "admin.users.tooLong";
    } else if (field === "phone" && value.length > 0) {
      if (!/^[0-9+\s]{0,15}$/.test(value)) return "validation.emailInvalid";
    }
    return "";
  }

  const labelClass = dark ? "text-white/80 text-xs" : "text-xs";
  const inputClass = dark ? "bg-white mt-1 h-8 text-sm" : "mt-1";
  const errorClass = dark
    ? "text-red-300 text-xs mt-1"
    : "text-red-500 text-xs mt-1";
  const containerClass = dark
    ? "bg-white/10 rounded-lg p-3 mb-2 flex flex-col gap-2"
    : "bg-gray-50 rounded-lg p-3 mb-2 flex flex-col gap-2";

  return (
    <div className={containerClass}>
      {/* En-tête */}
      <div className="flex justify-between items-center">
        <span
          className={
            dark
              ? "text-white text-xs font-semibold"
              : "text-xs font-semibold text-gray-700"
          }
        >
          {t("userProfile.guardians")} {idx + 1}
        </span>
        <span
          role="button"
          tabIndex={0}
          className={`cursor-pointer ${dark ? "text-white/60 hover:text-white text-xs" : "text-gray-400 hover:text-red-500 text-xs"}`}
          onClick={onRemove}
          onKeyDown={(e) => e.key === "Enter" && onRemove()}
        >
          ✕ {t("userProfile.deleteGuardian")}
        </span>
      </div>

      {/* Prénom + Nom */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className={labelClass}>{t("userProfile.firstName")}</Label>
          <Input
            value={parent.firstName}
            onChange={(e) => {
              const val = e.target.value.replace(/[^a-zA-ZÀ-ÿ'-]/g, "");
              const normalized =
                val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
              onChange({ ...parent, firstName: normalized });
              setErrorKeys((prev) => ({
                ...prev,
                firstName: validateFieldKey("firstName", normalized),
              }));
            }}
            maxLength={20}
            className={inputClass}
          />
          {/* t(clé) au rendu → se met à jour au changement de langue */}
          {errorKeys.firstName && (
            <p className={errorClass}>{t(errorKeys.firstName)}</p>
          )}
        </div>
        <div>
          <Label className={labelClass}>{t("userProfile.lastName")}</Label>
          <Input
            value={parent.lastName}
            onChange={(e) => {
              const val = e.target.value
                .replace(/[^a-zA-ZÀ-ÿ'-]/g, "")
                .toUpperCase();
              onChange({ ...parent, lastName: val });
              setErrorKeys((prev) => ({
                ...prev,
                lastName: validateFieldKey("lastName", val),
              }));
            }}
            maxLength={20}
            className={inputClass}
          />
          {errorKeys.lastName && (
            <p className={errorClass}>{t(errorKeys.lastName)}</p>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <Label className={labelClass}>{t("userProfile.email")}</Label>
        <Input
          type="email"
          value={parent.email}
          onChange={(e) => {
            onChange({ ...parent, email: e.target.value });
            setErrorKeys((prev) => ({
              ...prev,
              email: validateFieldKey("email", e.target.value),
            }));
          }}
          maxLength={50}
          className={inputClass}
        />
        {errorKeys.email && <p className={errorClass}>{t(errorKeys.email)}</p>}
      </div>

      {/* Téléphone */}
      <div>
        <Label className={labelClass}>
          {t("userProfile.phone")}{" "}
          <span className="opacity-60">({t("common.optional")})</span>
        </Label>
        <Input
          value={parent.phone}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9+\s]/g, "");
            onChange({ ...parent, phone: val });
            setErrorKeys((prev) => ({
              ...prev,
              phone: validateFieldKey("phone", val),
            }));
          }}
          maxLength={15}
          placeholder="ex: +33 6 12 34 56 78"
          className={inputClass}
        />
        {errorKeys.phone && <p className={errorClass}>{t(errorKeys.phone)}</p>}
      </div>

      {/* Adresse */}
      <div>
        <Label className={labelClass}>
          {t("userProfile.address")}{" "}
          <span className="opacity-60">({t("common.optional")})</span>
        </Label>
        <Input
          value={parent.address}
          onChange={(e) => onChange({ ...parent, address: e.target.value })}
          maxLength={80}
          className={inputClass}
        />
      </div>
    </div>
  );
}
