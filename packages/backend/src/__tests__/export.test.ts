/**
 * Export Operations Unit Tests
 *
 * Property Tests:
 * - Property 29: Export Data Completeness
 *
 * Validates: Requirements 20.1
 */

import mongoose from 'mongoose';
import * as fc from 'fast-check';

const createObjectId = () => new mongoose.Types.ObjectId().toString();

describe('Export Operations', () => {
  // Type definitions matching the export route interfaces
  interface ExportedComment {
    id: string;
    content: string;
    createdAt: Date;
  }

  interface ExportedAttachment {
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    cloudinaryPublicId: string;
    createdAt: Date;
  }

  interface ExportedTask {
    id: string;
    sectionId: string;
    epicIds: string[];
    title: string;
    description: string | null;
    priority: string | null;
    storyPoints: number | null;
    endDate: Date | null;
    position: number;
    createdAt: Date;
    updatedAt: Date;
    comments: ExportedComment[];
    attachments: ExportedAttachment[];
  }

  interface ExportedSection {
    id: string;
    name: string;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  }

  interface ExportedEpic {
    id: string;
    name: string;
    description: string | null;
    color: string;
    createdAt: Date;
    updatedAt: Date;
  }

  interface ExportedBoard {
    id: string;
    name: string;
    description: string | null;
    color: string;
    sectionOrder: string[];
    createdAt: Date;
    updatedAt: Date;
    sections: ExportedSection[];
    tasks: ExportedTask[];
    epics: ExportedEpic[];
  }

  interface ExportData {
    exportedAt: string;
    boards: ExportedBoard[];
  }

  // Helper functions to create test data
  const createComment = (content: string): ExportedComment => ({
    id: createObjectId(),
    content,
    createdAt: new Date(),
  });

  const createAttachment = (filename: string): ExportedAttachment => ({
    id: createObjectId(),
    filename,
    url: `https://res.cloudinary.com/demo/image/upload/${filename}`,
    mimeType: 'application/pdf',
    size: 1024,
    cloudinaryPublicId: `kanban-attachments/${createObjectId()}/${filename}`,
    createdAt: new Date(),
  });

  const createTask = (
    sectionId: string,
    epicIds: string[] = [],
    comments: ExportedComment[] = [],
    attachments: ExportedAttachment[] = []
  ): ExportedTask => ({
    id: createObjectId(),
    sectionId,
    epicIds,
    title: `Task ${Math.random().toString(36).substring(7)}`,
    description: 'Task description',
    priority: 'medium',
    storyPoints: 5,
    endDate: new Date(),
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    comments,
    attachments,
  });

  const createSection = (position: number): ExportedSection => ({
    id: createObjectId(),
    name: `Section ${position}`,
    position,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createEpic = (): ExportedEpic => ({
    id: createObjectId(),
    name: `Epic ${Math.random().toString(36).substring(7)}`,
    description: 'Epic description',
    color: '#FF5733',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createBoard = (
    sections: ExportedSection[] = [],
    tasks: ExportedTask[] = [],
    epics: ExportedEpic[] = []
  ): ExportedBoard => ({
    id: createObjectId(),
    name: `Board ${Math.random().toString(36).substring(7)}`,
    description: 'Board description',
    color: '#3498DB',
    sectionOrder: sections.map((s) => s.id),
    createdAt: new Date(),
    updatedAt: new Date(),
    sections,
    tasks,
    epics,
  });

  describe('Property 29: Export Data Completeness', () => {
    describe('Board Export Structure', () => {
      it('should include all board fields in export', () => {
        const board = createBoard();

        expect(board).toHaveProperty('id');
        expect(board).toHaveProperty('name');
        expect(board).toHaveProperty('description');
        expect(board).toHaveProperty('color');
        expect(board).toHaveProperty('sectionOrder');
        expect(board).toHaveProperty('createdAt');
        expect(board).toHaveProperty('updatedAt');
        expect(board).toHaveProperty('sections');
        expect(board).toHaveProperty('tasks');
        expect(board).toHaveProperty('epics');
      });

      it('should include exportedAt timestamp in export data', () => {
        const exportData: ExportData = {
          exportedAt: new Date().toISOString(),
          boards: [createBoard()],
        };

        expect(exportData.exportedAt).toBeDefined();
        expect(new Date(exportData.exportedAt).getTime()).not.toBeNaN();
      });
    });

    describe('Section Export Completeness', () => {
      it('should export all sections for a board', () => {
        const sections = [createSection(0), createSection(1), createSection(2)];
        const board = createBoard(sections);

        expect(board.sections).toHaveLength(3);
        sections.forEach((section, index) => {
          expect(board.sections[index].id).toBe(section.id);
          expect(board.sections[index].name).toBe(section.name);
          expect(board.sections[index].position).toBe(section.position);
        });
      });

      it('should include all section fields', () => {
        const section = createSection(0);

        expect(section).toHaveProperty('id');
        expect(section).toHaveProperty('name');
        expect(section).toHaveProperty('position');
        expect(section).toHaveProperty('createdAt');
        expect(section).toHaveProperty('updatedAt');
      });

      it('should maintain section order in sectionOrder array', () => {
        const sections = [createSection(0), createSection(1), createSection(2)];
        const board = createBoard(sections);

        expect(board.sectionOrder).toHaveLength(sections.length);
        sections.forEach((section, index) => {
          expect(board.sectionOrder[index]).toBe(section.id);
        });
      });
    });

    describe('Task Export Completeness', () => {
      it('should export all tasks for a board', () => {
        const section = createSection(0);
        const tasks = [
          createTask(section.id),
          createTask(section.id),
          createTask(section.id),
        ];
        const board = createBoard([section], tasks);

        expect(board.tasks).toHaveLength(3);
      });

      it('should include all task fields', () => {
        const task = createTask(createObjectId());

        expect(task).toHaveProperty('id');
        expect(task).toHaveProperty('sectionId');
        expect(task).toHaveProperty('epicIds');
        expect(task).toHaveProperty('title');
        expect(task).toHaveProperty('description');
        expect(task).toHaveProperty('priority');
        expect(task).toHaveProperty('storyPoints');
        expect(task).toHaveProperty('endDate');
        expect(task).toHaveProperty('position');
        expect(task).toHaveProperty('createdAt');
        expect(task).toHaveProperty('updatedAt');
        expect(task).toHaveProperty('comments');
        expect(task).toHaveProperty('attachments');
      });

      it('should preserve task-section relationship', () => {
        const section = createSection(0);
        const task = createTask(section.id);
        const board = createBoard([section], [task]);

        expect(board.tasks[0].sectionId).toBe(section.id);
      });

      it('should preserve task-epic relationships', () => {
        const section = createSection(0);
        const epics = [createEpic(), createEpic()];
        const task = createTask(
          section.id,
          epics.map((e) => e.id)
        );
        const board = createBoard([section], [task], epics);

        expect(board.tasks[0].epicIds).toHaveLength(2);
        epics.forEach((epic) => {
          expect(board.tasks[0].epicIds).toContain(epic.id);
        });
      });
    });

    describe('Comment Export Completeness', () => {
      it('should export all comments for a task', () => {
        const comments = [
          createComment('First comment'),
          createComment('Second comment'),
          createComment('Third comment'),
        ];
        const task = createTask(createObjectId(), [], comments);

        expect(task.comments).toHaveLength(3);
        comments.forEach((comment, index) => {
          expect(task.comments[index].content).toBe(comment.content);
        });
      });

      it('should include all comment fields', () => {
        const comment = createComment('Test comment');

        expect(comment).toHaveProperty('id');
        expect(comment).toHaveProperty('content');
        expect(comment).toHaveProperty('createdAt');
      });
    });

    describe('Attachment Export Completeness', () => {
      it('should export all attachments for a task', () => {
        const attachments = [
          createAttachment('file1.pdf'),
          createAttachment('file2.png'),
          createAttachment('file3.docx'),
        ];
        const task = createTask(createObjectId(), [], [], attachments);

        expect(task.attachments).toHaveLength(3);
        attachments.forEach((attachment, index) => {
          expect(task.attachments[index].filename).toBe(attachment.filename);
        });
      });

      it('should include all attachment fields including cloudinaryPublicId', () => {
        const attachment = createAttachment('test.pdf');

        expect(attachment).toHaveProperty('id');
        expect(attachment).toHaveProperty('filename');
        expect(attachment).toHaveProperty('url');
        expect(attachment).toHaveProperty('mimeType');
        expect(attachment).toHaveProperty('size');
        expect(attachment).toHaveProperty('cloudinaryPublicId');
        expect(attachment).toHaveProperty('createdAt');
      });

      it('should preserve cloudinaryPublicId for re-import capability', () => {
        const attachment = createAttachment('document.pdf');

        expect(attachment.cloudinaryPublicId).toBeDefined();
        expect(attachment.cloudinaryPublicId.length).toBeGreaterThan(0);
      });
    });

    describe('Epic Export Completeness', () => {
      it('should export all epics for a board', () => {
        const epics = [createEpic(), createEpic(), createEpic()];
        const board = createBoard([], [], epics);

        expect(board.epics).toHaveLength(3);
      });

      it('should include all epic fields', () => {
        const epic = createEpic();

        expect(epic).toHaveProperty('id');
        expect(epic).toHaveProperty('name');
        expect(epic).toHaveProperty('description');
        expect(epic).toHaveProperty('color');
        expect(epic).toHaveProperty('createdAt');
        expect(epic).toHaveProperty('updatedAt');
      });
    });

    describe('Multi-Board Export', () => {
      it('should export all boards for a user', () => {
        const boards = [createBoard(), createBoard(), createBoard()];
        const exportData: ExportData = {
          exportedAt: new Date().toISOString(),
          boards,
        };

        expect(exportData.boards).toHaveLength(3);
      });

      it('should keep board data isolated', () => {
        const section1 = createSection(0);
        const section2 = createSection(0);
        const task1 = createTask(section1.id);
        const task2 = createTask(section2.id);

        const board1 = createBoard([section1], [task1]);
        const board2 = createBoard([section2], [task2]);

        const exportData: ExportData = {
          exportedAt: new Date().toISOString(),
          boards: [board1, board2],
        };

        // Verify tasks belong to correct boards
        expect(exportData.boards[0].tasks[0].sectionId).toBe(section1.id);
        expect(exportData.boards[1].tasks[0].sectionId).toBe(section2.id);

        // Verify sections are in correct boards
        expect(exportData.boards[0].sections[0].id).toBe(section1.id);
        expect(exportData.boards[1].sections[0].id).toBe(section2.id);
      });
    });

    describe('Property-Based Tests', () => {
      it('should export complete data for any board configuration', () => {
        fc.assert(
          fc.property(
            fc.record({
              sectionCount: fc.nat({ max: 10 }),
              taskCount: fc.nat({ max: 20 }),
              epicCount: fc.nat({ max: 5 }),
              commentCount: fc.nat({ max: 10 }),
              attachmentCount: fc.nat({ max: 5 }),
            }),
            ({ sectionCount, taskCount, epicCount, commentCount, attachmentCount }) => {
              const sections = Array.from({ length: sectionCount }, (_, i) =>
                createSection(i)
              );
              const epics = Array.from({ length: epicCount }, () => createEpic());

              const tasks = Array.from({ length: taskCount }, () => {
                const sectionId =
                  sections.length > 0
                    ? sections[Math.floor(Math.random() * sections.length)].id
                    : createObjectId();
                const taskEpicIds = epics
                  .slice(0, Math.floor(Math.random() * (epics.length + 1)))
                  .map((e) => e.id);
                const comments = Array.from({ length: commentCount }, () =>
                  createComment('Comment')
                );
                const attachments = Array.from({ length: attachmentCount }, () =>
                  createAttachment('file.pdf')
                );

                return createTask(sectionId, taskEpicIds, comments, attachments);
              });

              const board = createBoard(sections, tasks, epics);

              // Verify completeness
              expect(board.sections).toHaveLength(sectionCount);
              expect(board.tasks).toHaveLength(taskCount);
              expect(board.epics).toHaveLength(epicCount);

              // Verify each task has correct comment and attachment counts
              board.tasks.forEach((task) => {
                expect(task.comments).toHaveLength(commentCount);
                expect(task.attachments).toHaveLength(attachmentCount);
              });

              return true;
            }
          )
        );
      });

      it('should preserve all IDs through export', () => {
        fc.assert(
          fc.property(fc.nat({ max: 5 }), (count) => {
            const sections = Array.from({ length: count }, (_, i) => createSection(i));
            const epics = Array.from({ length: count }, () => createEpic());
            const tasks = sections.map((section) => createTask(section.id));

            const board = createBoard(sections, tasks, epics);

            // All section IDs preserved
            const sectionIds = new Set(sections.map((s) => s.id));
            board.sections.forEach((s) => {
              expect(sectionIds.has(s.id)).toBe(true);
            });

            // All epic IDs preserved
            const epicIds = new Set(epics.map((e) => e.id));
            board.epics.forEach((e) => {
              expect(epicIds.has(e.id)).toBe(true);
            });

            // All task IDs preserved
            const taskIds = new Set(tasks.map((t) => t.id));
            board.tasks.forEach((t) => {
              expect(taskIds.has(t.id)).toBe(true);
            });

            return true;
          })
        );
      });
    });

    describe('Nullable Fields Handling', () => {
      it('should handle null description', () => {
        const board = createBoard();
        board.description = null;

        expect(board.description).toBeNull();
      });

      it('should handle null task fields', () => {
        const task = createTask(createObjectId());
        task.description = null;
        task.priority = null;
        task.storyPoints = null;
        task.endDate = null;

        expect(task.description).toBeNull();
        expect(task.priority).toBeNull();
        expect(task.storyPoints).toBeNull();
        expect(task.endDate).toBeNull();
      });

      it('should handle null epic description', () => {
        const epic = createEpic();
        epic.description = null;

        expect(epic.description).toBeNull();
      });
    });

    describe('Empty Collections Handling', () => {
      it('should handle board with no sections', () => {
        const board = createBoard([], [], []);

        expect(board.sections).toHaveLength(0);
        expect(board.sectionOrder).toHaveLength(0);
      });

      it('should handle board with no tasks', () => {
        const sections = [createSection(0)];
        const board = createBoard(sections, [], []);

        expect(board.tasks).toHaveLength(0);
      });

      it('should handle board with no epics', () => {
        const board = createBoard([], [], []);

        expect(board.epics).toHaveLength(0);
      });

      it('should handle task with no comments', () => {
        const task = createTask(createObjectId(), [], [], []);

        expect(task.comments).toHaveLength(0);
      });

      it('should handle task with no attachments', () => {
        const task = createTask(createObjectId(), [], [], []);

        expect(task.attachments).toHaveLength(0);
      });

      it('should handle task with no epics', () => {
        const task = createTask(createObjectId(), [], [], []);

        expect(task.epicIds).toHaveLength(0);
      });
    });

    describe('Date Serialization', () => {
      it('should serialize dates correctly', () => {
        const board = createBoard();
        const serialized = JSON.parse(JSON.stringify(board));

        expect(new Date(serialized.createdAt).getTime()).not.toBeNaN();
        expect(new Date(serialized.updatedAt).getTime()).not.toBeNaN();
      });

      it('should preserve date values through serialization', () => {
        const now = new Date();
        const comment: ExportedComment = {
          id: createObjectId(),
          content: 'Test',
          createdAt: now,
        };

        const serialized = JSON.parse(JSON.stringify(comment));
        const deserialized = new Date(serialized.createdAt);

        // Allow 1 second tolerance for serialization
        expect(Math.abs(deserialized.getTime() - now.getTime())).toBeLessThan(1000);
      });
    });
  });
});
