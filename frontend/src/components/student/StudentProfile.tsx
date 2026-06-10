import { useState } from "react";
import type { AuthUser } from "@/types";
import { formatName } from "@/utils/formatName";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import {
	Table,
	TableHeader,
	TableBody,
	TableCell,
	TableCellLeft,
	TableRow,
	TableCellParent,
} from "@/components/ui/table";
import React from "react";

interface Parent {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	phone?: string;
	address?: string;
}

interface StudentProfileProps {
	user: AuthUser | null;
	parents: Parent[];
	loadingParents: boolean;
}

const AVATAR_BASE = "http://localhost:5000/uploads/avatars/";
const API_BASE = "http://localhost:5000";

export default function StudentProfile({
	user,
	parents,
	loadingParents,
}: StudentProfileProps) {
	const { t } = useTranslation();
	const { updateUser } = useAuth();
	const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const calcAge = (dateOfBirth: string): number => {
		const dob = new Date(dateOfBirth);
		const today = new Date();
		let age = today.getFullYear() - dob.getFullYear();
		const m = today.getMonth() - dob.getMonth();
		if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
		return age;
	};

	return (
		<section className="page-section">
			{/* Avatar + nom + bouton */}
			<div className="bg-surface shadow-sm py-8 mb-3">
				<div className="flex flex-col items-center gap-3">
					{avatar ? (
						<img
							className="w-56 h-56 rounded-full object-cover border-4 border-primary"
							src={`${AVATAR_BASE}${avatar}?t=${Date.now()}`}
							alt={`${user?.firstName} ${user?.lastName}`}
						/>
					) : (
						<div className="w-56 h-56 rounded-full border-4 border-primary flex items-center justify-center text-8xl">
							{user?.firstName?.[0]}
							{user?.lastName?.[0]}
						</div>
					)}

					<div className="text-center mt-4">
						{(() => {
							const { first, last } = formatName(
								user?.firstName,
								user?.lastName,
							);
							return (
								<h2 className="text-2xl font-bold mb-4">
									{first} {last}
								</h2>
							);
						})()}
						<span className="text-sm ">
							{t(`student.profile.role`)}
						</span>
						<p className="text-sm mt-4">{user?.email}</p>
					</div>
				</div>
			</div>

			{/* Informations */}
			<div className="bg-surface shadow-sm px-8 py-4 mb-3">
				<Table>
					<TableBody>
						{user?.studentProfile?.schoolClass && (
							<TableRow>
								<TableCellLeft>{t(`student.profile.class`)}</TableCellLeft>
								<TableCell>
									{user.studentProfile.schoolClass.level}{" "}
									{user.studentProfile.schoolClass.section}
								</TableCell>
							</TableRow>
						)}
						{user?.studentProfile?.dateOfBirth && (
							<TableRow>
								<TableCellLeft>{t(`student.profile.dob`)}</TableCellLeft>
								<TableCell>
									{new Date(user.studentProfile.dateOfBirth).toLocaleDateString(
										"fr-FR",
									)}{" "}
									({calcAge(user.studentProfile.dateOfBirth)} ans)
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Parents */}
			<div className="bg-surface shadow-sm px-8 py-4">
				<TableHeader>{t(`student.profile.officialParents`)}</TableHeader>

				{/* {loadingParents ? (
					<div className="text-sm text-center py-4">
						{t(`student.profile.loading`)}
					</div>
				) : parents.length === 0 ? (
					<div className="text-sm text-center py-4">
						{t(`student.profile.noParent`)}
					</div>
				) : ( */}
					<Table>
						<TableBody>
							{parents.map((p) => {
								const { first, last } = formatName(p.firstName, p.lastName);
								return (
									<React.Fragment key={p.id}>
										<TableRow>
											<TableCellParent>
												{first} {last}
											</TableCellParent>
											<TableCell></TableCell>
										</TableRow>

										{[
											{ label: t(`student.profile.email`), value: p.email },
											{
												label: t(`student.profile.phone`),
												value: p.phone ?? "—",
											},
											{
												label: t(`student.profile.address`),
												value: p.address ?? "—",
											},
										].map((row) => (
											<TableRow key={`${p.id}-${row.label}`}>
												<TableCellLeft>{row.label}</TableCellLeft>
												<TableCell>{row.value}</TableCell>
											</TableRow>
										))}
									</React.Fragment>
								);
							})}
						</TableBody>
					</Table>
				{/* )} */}
			</div>
		</section>
	);
}
