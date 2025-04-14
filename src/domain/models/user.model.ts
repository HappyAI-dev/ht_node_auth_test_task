import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { WorkspaceMember } from '@domain/models/workspace.model';
import { BaseModel, BaseProps } from '@domain/models/base.model';

export interface UserProps extends BaseProps {
  id?: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
}

@Entity('users')
export class User extends BaseModel<UserProps> {
  constructor(props: Partial<UserProps> = {}) {
    super({
      email: props.email,
      password: props.password,
      firstName: props.firstName,
      lastName: props.lastName,
      isEmailVerified: props.isEmailVerified ?? false,
      lastLoginAt: props.lastLoginAt,
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt
    });
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  get email(): string {
    return this.props.email;
  }
  set email(value: string) {
    this.props.email = value;
  }

  @Column({ type: 'varchar' })
  @Exclude()
  get password(): string {
    return this.props.password;
  }
  set password(value: string) {
    this.props.password = value;
  }

  @Column({ type: 'varchar', nullable: true })
  get firstName(): string | undefined {
    return this.props.firstName;
  }
  set firstName(value: string | undefined) {
    this.props.firstName = value;
  }

  @Column({ type: 'varchar', nullable: true })
  get lastName(): string | undefined {
    return this.props.lastName;
  }
  set lastName(value: string | undefined) {
    this.props.lastName = value;
  }

  @Column({ type: 'boolean', default: false })
  get isEmailVerified(): boolean {
    return this.props.isEmailVerified;
  }
  set isEmailVerified(value: boolean) {
    this.props.isEmailVerified = value;
  }

  @Column({ type: 'timestamp with time zone', nullable: true })
  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }
  set lastLoginAt(value: Date | undefined) {
    this.props.lastLoginAt = value;
  }

  @OneToMany(() => WorkspaceMember, member => member.user)
  workspaces: WorkspaceMember[];

  async setPassword(password: string): Promise<void> {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(password, salt);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  updateLastLogin(): void {
    this.lastLoginAt = new Date();
  }

  verifyEmail(): void {
    this.isEmailVerified = true;
  }

  static async create(email: string, password: string, firstName?: string, lastName?: string): Promise<User> {
    const user = new User({
      email,
      password: '',
      firstName,
      lastName,
      isEmailVerified: false,
    });

    await user.setPassword(password);
    return user;
  }

  toJSON(): Partial<UserProps> {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      isEmailVerified: this.isEmailVerified,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
