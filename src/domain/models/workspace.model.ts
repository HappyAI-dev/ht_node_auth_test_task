import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '@domain/models/user.model';
import { BaseModel, BaseProps } from '@domain/models/base.model';

export enum WorkspaceMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

export interface WorkspaceProps extends BaseProps {
  id?: string;
  name: string;
  description?: string;
}

@Entity('workspaces')
export class Workspace extends BaseModel<WorkspaceProps> {
  constructor(props: Partial<WorkspaceProps> = {}) {
    super({
      name: props.name || '',
      description: props.description,
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  @PrimaryGeneratedColumn('uuid')
  override get id(): string {
    return this.props.id;
  }

  @Column({ type: 'varchar' })
  get name(): string {
    return this.props.name;
  }
  set name(value: string) {
    this.props.name = value;
  }

  @Column({ type: 'varchar', nullable: true })
  get description(): string | undefined {
    return this.props.description;
  }
  set description(value: string | undefined) {
    this.props.description = value;
  }

  @OneToMany(() => WorkspaceMember, (member) => member.workspace)
  members: WorkspaceMember[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  get updatedAt(): Date {
    return this.props.updatedAt || new Date();
  }

  hasAccess(userId: string): boolean {
    return this.members?.some((member) => member.userId === userId) || false;
  }

  getUserRole(userId: string): WorkspaceMemberRole | null {
    const member = this.members?.find((m) => m.userId === userId);
    return member?.role || null;
  }

  addMember(
    userId: string,
    role: WorkspaceMemberRole = WorkspaceMemberRole.MEMBER,
  ): void {
    if (!this.members?.some((m) => m.userId === userId)) {
      const member = new WorkspaceMember();
      member.workspaceId = this.id;
      member.userId = userId;
      member.role = role;
      this.members = [...(this.members ?? []), member];
    }
  }

  removeMember(userId: string): void {
    if (userId === this.id) {
      throw new Error('Cannot remove workspace');
    }
    this.members = this.members?.filter((m) => m.userId !== userId);
  }

  changeMemberRole(userId: string, newRole: WorkspaceMemberRole): void {
    if (userId === this.id && newRole !== WorkspaceMemberRole.OWNER) {
      throw new Error("Cannot change workspace's role");
    }
    const member = this.members?.find((m) => m.userId === userId);
    if (member) {
      member.role = newRole;
    }
  }

  static create(name: string, owner: User): Workspace {
    if (!this.isValidName(name)) {
      throw new Error(`Workspace name "${name}" is invalid`);
    }

    const workspace = new Workspace({
      id: '',
      name: name.trim(),
    });

    workspace.addMember(owner.id, WorkspaceMemberRole.OWNER);
    return workspace;
  }

  private static isValidName(name: string): boolean {
    return name.trim().length >= 3 && name.trim().length <= 50;
  }

  toJSON(): Partial<WorkspaceProps> {
    return {
      id: this.id,
      name: this.name,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

export interface WorkspaceMemberProps extends BaseProps {
  id?: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceMemberRole;
}

@Entity('workspace_members')
export class WorkspaceMember extends BaseModel<WorkspaceMemberProps> {
  constructor(props: Partial<WorkspaceMemberProps> = {}) {
    super({
      userId: props.userId || '',
      workspaceId: props.workspaceId || '',
      role: props.role || WorkspaceMemberRole.MEMBER,
      id: props.id,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  @PrimaryGeneratedColumn('uuid')
  override get id(): string {
    return this.props.id;
  }

  @Column({ type: 'uuid' })
  get userId(): string {
    return this.props.userId;
  }
  set userId(value: string) {
    this.props.userId = value;
  }

  @Column({ type: 'uuid' })
  get workspaceId(): string {
    return this.props.workspaceId;
  }
  set workspaceId(value: string) {
    this.props.workspaceId = value;
  }

  @Column({ type: 'varchar', default: WorkspaceMemberRole.MEMBER })
  get role(): WorkspaceMemberRole {
    return this.props.role;
  }
  set role(value: WorkspaceMemberRole) {
    this.props.role = value;
  }

  @CreateDateColumn({ type: 'timestamp with time zone' })
  get createdAt(): Date {
    return this.props.createdAt;
  }

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Workspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspace;
}
