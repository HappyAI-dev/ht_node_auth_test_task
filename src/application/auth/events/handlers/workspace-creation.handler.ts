import { IEventHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkspaceCreationRequiredEvent } from '../impl/workspace-creation-required.event';
import { Workspace } from '@domain/models/workspace.model';
import { WorkspaceMember, WorkspaceMemberRole } from '@domain/models/workspace.model';

@Injectable()
export class WorkspaceCreationHandler implements IEventHandler<WorkspaceCreationRequiredEvent> {
  private readonly logger = new Logger(WorkspaceCreationHandler.name);

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>
  ) {}

  async handle(event: WorkspaceCreationRequiredEvent): Promise<void> {
    this.logger.log(`Creating default workspace for user ${event.user.id}`);

    const workspace = new Workspace({
      name: `${event.user.firstName}'s Workspace`,
      ownerId: event.user.id
    });

    const savedWorkspace = await this.workspaceRepository.save(workspace);

    const member = new WorkspaceMember();
    member.userId = event.user.id;
    member.workspaceId = savedWorkspace.id;
    member.role = WorkspaceMemberRole.OWNER;

    await this.workspaceMemberRepository.save(member);

    this.logger.log(`Default workspace created for user ${event.user.id}`);
  }
}
