import { useState } from "react";
import { Checkbox } from "../components/ui/checkbox";

export default function ConvocationSelector({ selected, onSend} : 
{
	selected: any;
	onSend: (date: string, message: string, targetRole: string[]) => Promise<void>;
})
{
	if (!selected) return null;


	const people = [];

	console.log(!selected.isAnonymous);

	// --- Alerteur (si pas anonyme) ---
	if (!selected.isAnonymous && selected.student?.reporter) {
		people.push({
			id: "alerteur",
			role: "Alerteur",
			fullName: `${reporter.firstName} ${reporter.lastName}`,
		});
	}
		
	// console.log(!selected.isAnonymous);

	// --- Victime ---
	let victimName = "";
	
	if (selected.title?.includes("Je suis témoin")) {
		const match = selected.description?.match(/\| Victime : (.+?)(\||$)/);
			victimName = match ? match[1].trim() : "Victime inconnue";
	} else {
		// Cas : l’alerteur est victime
		victimName = selected.isAnonymous
		? "Anonyme"
		: `${selected.student?.firstName} ${selected.student?.lastName}`;
	}

	people.push({
		id: "victime",
		role: "Victime",
		fullName: victimName,
	});

	// --- Suspects ---
	selected.suspects?.forEach((s, i) => {
		const fullName = s.user
			? `${s.user.firstName} ${s.user.lastName}`
			: s.freeText;

		people.push({
			id: `suspect_${i}`,
			role: selected.suspects.length > 1 ? `Suspect ${i + 1}` : "Suspect",
			fullName,
		});
	});

	return (
		<div className="flex flex-col gap-3 mb-5">
			{people.map(p => (
			<div key={p.id} className="flex items-center gap-2">
			<Checkbox id={p.id} />
			<label htmlFor={p.id} className="text-sm cursor-pointer">
				<strong>{p.role}</strong> — {p.fullName}
			</label>
			</div>
		))}
		</div>
	);
}
