import NextAuth from "next-auth";
import { authConfigEdge } from "@/lib/auth/config.edge";

// Edge Runtime用（middleware専用）: Prismaを含まない
export const { auth } = NextAuth(authConfigEdge);
