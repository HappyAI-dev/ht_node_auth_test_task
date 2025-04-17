export interface BaseProps {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export abstract class BaseModel<T extends BaseProps> {
  protected props: T;

  constructor(props: T) {
    this.props = {
      ...props,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    };
  }

  get id(): string {
    return this.props.id;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): Partial<T> {
    return { ...this.props };
  }
}
