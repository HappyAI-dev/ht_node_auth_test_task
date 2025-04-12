import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { WorkspaceRole } from '../interfaces/workspace.interface';
import { ForbiddenError } from '../errors/base.error';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<WorkspaceRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user, workspace } = context.switchToHttp().getRequest();
    if (!user || !workspace) {
      throw new ForbiddenError('No user or workspace context');
    }

    const userRole = workspace.members.find(member => member.userId === user.id)?.role;
    if (!userRole) {
      throw new ForbiddenError('User is not a member of this workspace');
    }

    return requiredRoles.includes(userRole);
  }
}
