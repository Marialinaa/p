import { User } from './user.model';

export interface BlogPost {
  id?: number;
  title: string;
  content: string;
  author?: string;
  authorId?: number;
  authorUser?: User;
  createdAt?: Date;
}
