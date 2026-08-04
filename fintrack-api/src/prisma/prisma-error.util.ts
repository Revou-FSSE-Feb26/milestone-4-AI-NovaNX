import { Prisma } from '@prisma/client';

// Prisma error code for a foreign key constraint violation, e.g. deleting a
// row that is still referenced by another row through an `onDelete: Restrict`
// relation (see prisma/schema.prisma).
const FOREIGN_KEY_CONSTRAINT_CODE = 'P2003';
const UNIQUE_CONSTRAINT_CODE = 'P2002';

export function isForeignKeyConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === FOREIGN_KEY_CONSTRAINT_CODE
  );
}

export function isUniqueConstraintError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === UNIQUE_CONSTRAINT_CODE
  );
}
