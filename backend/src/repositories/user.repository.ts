import { User } from '@prisma/client';
import prisma from '../lib/prisma';

export class UserRepository {
  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phone },
    });
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async create(phone: string): Promise<User> {
    return prisma.user.create({
      data: { phone },
    });
  }

  async findOrCreate(phone: string): Promise<User> {
    return prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
    });
  }
}

export const userRepository = new UserRepository();
export default userRepository;
