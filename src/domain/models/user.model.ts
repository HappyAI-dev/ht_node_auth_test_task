import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { WorkspaceMember } from '@domain/models/workspace.model';
import { BaseModel, BaseProps } from '@domain/models/base.model';
import { SHA256, lib } from 'crypto-js';
import { Logger } from '@nestjs/common';


export interface ReferralProps {
  level: number;
  credit: number;
  refcount?: number;
  streak?: number;
  strTimestamp?: Date;
}


export interface UserProps extends BaseProps {
  id?: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  refCode?: string;
  referralData?: ReferralProps; //firstChangeBytwelve
}


@Entity('users')
export class User extends BaseModel<UserProps> {
    private readonly logger = new Logger(User.name);
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
      updatedAt: props.updatedAt,
      refCode: props.refCode,
      referralData: props.referralData //secondchange
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

  @Index()
  @Column({ type: 'varchar', nullable: true })
  get refCode(): string | undefined {
    return this.props.refCode;
  }
  set refCode(value: string | undefined) {
    this.props.refCode = value;
  }


  @Column({type: "jsonb", nullable: true}) //уточнить тип
  get referralData(): ReferralProps | undefined {
    return this.props.referralData;
  } 

  get level(): number | undefined {
    return this.props.referralData?.level;
  } 

  get credit(): number | undefined {
    return this.props.referralData?.credit;
  } 

  get streak(): number | undefined {
    return this.props.referralData?.streak;
  } 
  get refcount(): number | undefined {
    return this.props.referralData?.refcount;
  } 

  get strTimestamp(): Date | undefined {
    return this.props.referralData?.strTimestamp;
  }

  set referralData(jsonbObj: ReferralProps | undefined) {
    this.props.referralData = jsonbObj;
  }

  set level(level: number | undefined) {
    this.props.referralData.level = level;
  }

  set refcount(value: number | undefined) {
    this.props.referralData.refcount = value;
  }

  set credit(credit: number | undefined) {
    this.props.referralData.credit = credit;
  }

  set streak(streak: number | undefined) {
    this.props.referralData.streak = streak;
  }

  set strTimestamp(timestamp: Date | undefined) {
    this.props.referralData.strTimestamp = timestamp;
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

  generateGenesisRefBox(): void {
    const randomBytes = lib.WordArray.random(16); 


    const hash = SHA256(randomBytes).toString(); 
  
    this.refCode = hash.substring(0, 12);
    this.referralData = {
      credit: 0,
      refcount: 0,
      level: 1,
      streak: 0,
      strTimestamp: new Date(),
    };

  }

  generateRefBoxByReferredUser(): void {
    const randomBytes = lib.WordArray.random(16);  

    const hash = SHA256(randomBytes).toString(); 
  
    this.refCode = hash.substring(0, 12);
    this.referralData = {
      credit: 100,
      refcount: 0,
      level: 1,
      streak: 0,
      strTimestamp: new Date(),
    };
  }


  compareByDateWithTime(lastDate: Date): boolean{ 
    const currentDay = new Date(); 
  
    const diffInMillis = currentDay.getTime() - lastDate.getTime();
  
    return diffInMillis < 24 * 60 * 60 * 1000;
  
  }

  processReferral(logger: Logger): void {
    this.updateRefCount(logger);
    this.updateStreak(logger);
    this.applyCreditReward(logger);
  }

  
  private updateRefCount(logger: Logger): void {
    this.refcount = (this.refcount ?? 0) + 1;
    logger.log(`refcount increased: ${this.refcount}`);   

  
    if (this.refcount >= 3 && (this.level ?? 1) === 1) {
      this.level = 2;
      logger.log(`level increased to 2`);
    }
  }
  
  private updateStreak(logger: Logger): void {
    if (!this.strTimestamp) {
      this.strTimestamp = new Date();
      this.streak = (this.streak ?? 0) + 1;
      logger.log(`streak initialized to: ${this.streak} at ${this.strTimestamp}`);
      return;
    }
  
    const shouldIncrease = this.compareByDateWithTime(this.strTimestamp);
  
    if (shouldIncrease) {
      this.streak = (this.streak ?? 0) + 1;
      this.strTimestamp = new Date();
      logger.log(`streak increased to: ${this.streak} at ${this.strTimestamp} `);
    } else {
      this.streak = 0;
      this.strTimestamp = undefined;
      logger.log(`streak reset`);
    }
  }
  
  private applyCreditReward(logger: Logger): void {
    const base = (this.level ?? 1) <= 1 ? 100 : 150;
    this.credit = (this.credit ?? 0) + base + (this.streak ?? 0);
    logger.log(`User credit updated: ${this.credit}`);
  }

  static async create(email: string, password: string, firstName?: string, lastName?: string, refCode?: string, referralData?: ReferralProps): Promise<User> {
    const user = new User({
      email,
      password: '',
      firstName,
      lastName,
      isEmailVerified: false,
      refCode,
      referralData,

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
      refCode: this.refCode,
      referralData: this.referralData
    };
  }
}
