import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model with role-based access
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["admin", "manager", "recruiter"] }).notNull().default("recruiter"),
  avatar: text("avatar"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Requirement model for job positions
export const requirements = pgTable("requirements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(),
  description: text("description").notNull(),
  skills: text("skills").array().notNull(),
  experience: integer("experience").notNull(),
  location: text("location").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).notNull().default("medium"),
  status: text("status", { enum: ["draft", "pending", "approved", "closed"] }).notNull().default("draft"),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRequirementSchema = createInsertSchema(requirements).omit({
  id: true,
  createdAt: true,
});

// Recruitment stages configuration
export const stages = pgTable("stages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  order: integer("order").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
});

export const insertStageSchema = createInsertSchema(stages).omit({
  id: true,
});

// Candidate model
export const candidates = pgTable("candidates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  currentTitle: text("current_title"),
  experience: integer("experience"),
  skills: text("skills").array(),
  resumeUrl: text("resume_url"),
  resumeText: text("resume_text"),
  currentStageId: integer("current_stage_id").notNull(),
  requirementId: integer("requirement_id").notNull(),
  matchPercentage: integer("match_percentage"),
  status: text("status", { enum: ["active", "hired", "rejected", "withdrawn"] }).notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  notes: text("notes"),
});

export const insertCandidateSchema = createInsertSchema(candidates).omit({
  id: true,
  createdAt: true,
});

// Stage transitions/history
export const stageHistory = pgTable("stage_history", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  fromStageId: integer("from_stage_id"),
  toStageId: integer("to_stage_id").notNull(),
  movedBy: integer("moved_by").notNull(),
  movedAt: timestamp("moved_at").notNull().defaultNow(),
  comments: text("comments"),
});

export const insertStageHistorySchema = createInsertSchema(stageHistory).omit({
  id: true,
  movedAt: true,
});

// Interviews
export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  requirementId: integer("requirement_id").notNull(),
  scheduledTime: timestamp("scheduled_time").notNull(),
  duration: integer("duration").notNull(), // minutes
  interviewers: integer("interviewers").array().notNull(),
  type: text("type", { enum: ["screening", "technical", "hr", "cultural", "final"] }).notNull(),
  location: text("location"),
  status: text("status", { enum: ["scheduled", "completed", "canceled", "no-show"] }).notNull().default("scheduled"),
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
});

// Interview feedback
export const requirementRecruiters = pgTable("requirement_recruiters", {
  id: serial("id").primaryKey(),
  requirementId: integer("requirement_id").notNull().references(() => requirements.id),
  recruiterId: integer("recruiter_id").notNull().references(() => users.id),
});

export type RequirementRecruiter = typeof requirementRecruiters.$inferSelect;
export type InsertRequirementRecruiter = typeof requirementRecruiters.$inferInsert;

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").notNull(),
  providedBy: integer("provided_by").notNull(),
  rating: integer("rating").notNull(),
  strengths: text("strengths").array(),
  weaknesses: text("weaknesses").array(),
  comments: text("comments"),
  recommendation: text("recommendation", { enum: ["strong_yes", "yes", "maybe", "no", "strong_no"] }).notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const insertFeedbackSchema = createInsertSchema(feedback).omit({
  id: true,
  submittedAt: true,
});

// Comments
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),
  userId: integer("user_id").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertRequirementRecruiterSchema = createInsertSchema(requirementRecruiters).omit({
  id: true,
});

// Export all types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Requirement = typeof requirements.$inferSelect;
export type InsertRequirement = z.infer<typeof insertRequirementSchema>;

export type Stage = typeof stages.$inferSelect;
export type InsertStage = z.infer<typeof insertStageSchema>;

export type Candidate = typeof candidates.$inferSelect;
export type InsertCandidate = z.infer<typeof insertCandidateSchema>;

export type StageHistory = typeof stageHistory.$inferSelect;
export type InsertStageHistory = z.infer<typeof insertStageHistorySchema>;

export type Interview = typeof interviews.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;

export type Feedback = typeof feedback.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type RequirementRecruiter = typeof requirementRecruiters.$inferSelect;
export type InsertRequirementRecruiter = z.infer<typeof insertRequirementRecruiterSchema>;
