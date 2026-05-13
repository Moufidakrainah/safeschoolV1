import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { StaffProfile } from '../staff/staff-profile.entity';

@Entity('classes')
export class SchoolClass {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() level: string;

  @Column() section: string;

  @ManyToMany(() => StaffProfile, staff => staff.classes)
  staff: StaffProfile[];
}
