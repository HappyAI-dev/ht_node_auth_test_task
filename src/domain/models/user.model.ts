import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { WorkspaceMember } from './workspace.model';
import { BaseModel, BaseProps } from './base.model';

export interface UserProps extends BaseProps {
  id?: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  referralCode?: string;
  referredById?: string;
  referralLevel: number;
  referralCount: number;
  referralStreak: number;
  lastReferralDate?: Date;
  credits: number;
}

@Entity('users')
export class User extends BaseModel<UserProps> {
  constructor(props: Partial<UserProps> = {}) {
    super({
      email: props.email || '',
      password: props.password || '',
      firstName: props.firstName,
      lastName: props.lastName,
      isEmailVerified: props.isEmailVerified ?? false,
      lastLoginAt: props.lastLoginAt,
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
      referralCode: props.referralCode,
      referredById: props.referredById,
      referralLevel: props.referralLevel ?? 1,
      referralCount: props.referralCount ?? 0,
      referralStreak: props.referralStreak ?? 0,
      lastReferralDate: props.lastReferralDate,
      credits: props.credits ?? 0,
    });
  }

  @PrimaryGeneratedColumn('uuid')
  override get id(): string {
    return this.props.id;
  }

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

  @Column({ type: 'varchar', nullable: true, unique: true })
  get referralCode(): string | undefined {
    return this.props.referralCode;
  }
  set referralCode(value: string | undefined) {
    this.props.referralCode = value;
  }

  @Column({ type: 'uuid', nullable: true })
  get referredById(): string | undefined {
    return this.props.referredById;
  }
  set referredById(value: string | undefined) {
    this.props.referredById = value;
  }

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referred_by_id' })
  referredBy: User;

  @Column({ type: 'int', default: 1 })
  get referralLevel(): number {
    return this.props.referralLevel;
  }
  set referralLevel(value: number) {
    this.props.referralLevel = value;
  }

  @Column({ type: 'int', default: 0 })
  get referralCount(): number {
    return this.props.referralCount;
  }
  set referralCount(value: number) {
    this.props.referralCount = value;
  }

  @Column({ type: 'int', default: 0 })
  get referralStreak(): number {
    return this.props.referralStreak;
  }
  set referralStreak(value: number) {
    this.props.referralStreak = value;
  }

  @Column({ type: 'timestamp with time zone', nullable: true })
  get lastReferralDate(): Date | undefined {
    return this.props.lastReferralDate;
  }
  set lastReferralDate(value: Date | undefined) {
    this.props.lastReferralDate = value;
  }

  @Column({ type: 'int', default: 0 })
  get credits(): number {
    return this.props.credits;
  }
  set credits(value: number) {
    this.props.credits = value;
  }

  @OneToMany(() => WorkspaceMember, (member) => member.user)
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

  generateReferralCode(): void {
    if (!this.referralCode) {
      // Генерация уникального 8-символьного кода
      const randomChars = Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();
      this.referralCode = randomChars;
    }
  }

  addCredits(amount: number): void {
    this.credits += amount;
  }

  incrementReferralCount(): void {
    this.referralCount += 1;

    // Если достигли 3 приглашений, повышаем уровень
    if (this.referralCount >= 3 && this.referralLevel === 1) {
      this.referralLevel = 2;
    }
  }

  updateReferralStreak(referralDate: Date): void {
    const today = new Date(referralDate);
    today.setHours(0, 0, 0, 0);

    if (!this.lastReferralDate) {
      this.referralStreak = 1;
    } else {
      const lastReferralDay = new Date(this.lastReferralDate);
      lastReferralDay.setHours(0, 0, 0, 0);

      // Вычисляем разницу в днях
      const diffTime = today.getTime() - lastReferralDay.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Приглашение в последовательный день
        this.referralStreak += 1;
      } else if (diffDays > 1) {
        // Пропуск дня - сбрасываем стрик
        this.referralStreak = 1;
      }
      // Если приглашение в тот же день, стрик не меняется
    }

    this.lastReferralDate = today;
  }

  calculateReferralBonus(): number {
    const baseCredits = this.referralLevel === 1 ? 100 : 150;
    return baseCredits + this.referralStreak;
  }

  static async create(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    referredById?: string,
  ): Promise<User> {
    const user = new User({
      email,
      password: '',
      firstName,
      lastName,
      isEmailVerified: false,
      referredById,
    });

    await user.setPassword(password);
    user.generateReferralCode();
    return user;
  }

  override toJSON(): Partial<UserProps> {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      isEmailVerified: this.isEmailVerified,
      lastLoginAt: this.lastLoginAt,
      referralCode: this.referralCode,
      referredById: this.referredById,
      referralLevel: this.referralLevel,
      referralCount: this.referralCount,
      referralStreak: this.referralStreak,
      lastReferralDate: this.lastReferralDate,
      credits: this.credits,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
