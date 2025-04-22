import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { BaseModel, BaseProps } from '@domain/models/base.model';
import { User } from './user.model';

export interface ReferralHistoryProps extends BaseProps {
  inviter_id: string;
  invitee_id: string;
  created_at: Date;
  updated_at: Date; 
}

export interface ReferralProps extends BaseProps {
  id: string;
  user_id: string;
  credits: number;
  referral_level: number;
  referral_streak: number;
  referral_streak_updated_at: Date;
  referred_by: string | null;
}
  
@Entity('referrals')
export class Referral extends BaseModel<ReferralProps> {
  constructor(props: Partial<ReferralProps> = {}) {
    super({
      id: props.id,
      user_id: props.user_id,
      credits: props.credits,
      referral_level: props.referral_level,
      referral_streak: props.referral_streak,
      referral_streak_updated_at: props.referral_streak_updated_at,
      referred_by: props.referred_by
    });
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  get userId(): string {
    return this.props.user_id;
  }
  set userId(value: string) {
    this.props.user_id = value;
  }

  @Column({ type: 'integer', default: 0 })
  get credits(): number {
    return this.props.credits;
  }
  set credits(value: number) {
    this.props.credits = value;
  }

  @Column({ type: 'integer', default: 1 })
  get referral_level(): number {
    return this.props.referral_level;
  }
  set referral_level(value: number) {
    this.props.referral_level = value;
  }

  @Column({ type: 'integer', default: 0 })
  get referral_streak(): number {
    return this.props.referral_streak;
  }
  set referral_streak(value: number) {
    this.props.referral_streak = value;
  }

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  get referral_streak_updated_at(): Date {
    return this.props.referral_streak_updated_at;
  }
  set referral_streak_updated_at(value: Date) {
    this.props.referral_streak_updated_at = value;
  }

  @Column({ type: 'uuid', nullable: true })
  get referred_by(): string | undefined {
    return this.props.referred_by;
  }
  set referred_by(value: string | undefined) {
    this.props.referred_by = value;
  }

  @OneToOne(() => User, (user) => user.referral)
  @JoinColumn()
  user: User;
 

  updateReferralStreak(): void {
    this.referral_streak_updated_at = new Date();
  }


  static async create(user: User, credits: number, referral_level: number, referral_streak: number, referral_streak_updated_at: Date, referred_by?: string): Promise<Referral> {
    const referral = new Referral({
      id: '',
      user_id: user.id,
      credits,
      referral_level,
      referral_streak,
      referral_streak_updated_at,
      referred_by
    });
    return referral;
  }
}



@Entity('referral_history')
export class ReferralHistory extends BaseModel<ReferralHistoryProps> {
  constructor(props: Partial<ReferralHistoryProps> = {}) {
    super({
      inviter_id: props.inviter_id,
      invitee_id: props.invitee_id,
      created_at: props.created_at,
      updated_at: props.updated_at,
    });
  }

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, user => user.sentReferrals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inviter_id' })
  inviter!: User;

  @ManyToOne(() => User, user => user.receivedReferrals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invitee_id' })
  invitee!: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;


static async create(inviter: User, invitee: User): Promise<ReferralHistory> {
  const referral = new ReferralHistory({
    inviter_id: inviter.id,
    invitee_id: invitee.id,
  });
  return referral;
}
}

