import type PrismaTypes from "@repo/database/generated/pothos";
import { WorkspaceStatus } from "@repo/database/generated/prisma/enums";
import { z } from "zod";
import { builder } from "./builder";
import { badUserInput, notFound } from "./errors";

type UserShape = PrismaTypes["User"]["Shape"];
type WorkspaceShape = PrismaTypes["Workspace"]["Shape"];
