export interface ICommand {
  readonly type: string;
}

export interface ICommandHandler<T extends ICommand> {
  execute(command: T): Promise<void>;
}

export interface IQuery<R> {
  readonly type: string;
}

export interface IQueryHandler<T extends IQuery<R>, R> {
  execute(query: T): Promise<R>;
}

export interface IEvent {
  readonly type: string;
  readonly timestamp: Date;
}

export interface IEventHandler<T extends IEvent> {
  handle(event: T): Promise<void>;
}
