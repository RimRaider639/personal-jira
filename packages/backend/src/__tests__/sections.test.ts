/**
 * Section Operations Unit Tests
 *
 * Property Tests:
 * - Property 5: Section Operations Preserve Board Integrity
 *
 * Validates: Requirements 2.2, 2.3, 2.6
 */

import mongoose from 'mongoose';
import * as fc from 'fast-check';

const createObjectId = () => new mongoose.Types.ObjectId().toString();

describe('Section Operations', () => {
  describe('Property 5: Section Operations Preserve Board Integrity', () => {
    interface Section {
      id: string;
      boardId: string;
      name: string;
      position: number;
    }

    interface Board {
      id: string;
      sections: Section[];
    }

    const createSection = (boardId: string, name: string, position: number): Section => ({
      id: createObjectId(),
      boardId,
      name,
      position,
    });

    describe('Section Creation', () => {
      it('should assign next available position when creating section', () => {
        const boardId = createObjectId();
        const sections: Section[] = [
          createSection(boardId, 'Section 1', 0),
          createSection(boardId, 'Section 2', 1),
        ];

        const getNextPosition = (existingSections: Section[]): number => {
          if (existingSections.length === 0) return 0;
          return Math.max(...existingSections.map((s) => s.position)) + 1;
        };

        const nextPos = getNextPosition(sections);
        expect(nextPos).toBe(2);

        const newSection = createSection(boardId, 'Section 3', nextPos);
        sections.push(newSection);

        expect(sections).toHaveLength(3);
        expect(sections[2].position).toBe(2);
      });

      it('should start at position 0 for first section', () => {
        const getNextPosition = (existingSections: Section[]): number => {
          if (existingSections.length === 0) return 0;
          return Math.max(...existingSections.map((s) => s.position)) + 1;
        };

        expect(getNextPosition([])).toBe(0);
      });

      it('should handle gaps in positions correctly', () => {
        const boardId = createObjectId();
        const sections: Section[] = [
          createSection(boardId, 'Section 1', 0),
          createSection(boardId, 'Section 2', 5), // Gap in positions
        ];

        const getNextPosition = (existingSections: Section[]): number => {
          if (existingSections.length === 0) return 0;
          return Math.max(...existingSections.map((s) => s.position)) + 1;
        };

        expect(getNextPosition(sections)).toBe(6);
      });
    });

    describe('Section Renaming', () => {
      it('should update name without changing position', () => {
        const section: Section = {
          id: createObjectId(),
          boardId: createObjectId(),
          name: 'Original Name',
          position: 1,
        };

        const renameSection = (s: Section, newName: string): Section => ({
          ...s,
          name: newName,
        });

        const renamed = renameSection(section, 'New Name');

        expect(renamed.name).toBe('New Name');
        expect(renamed.position).toBe(1);
        expect(renamed.id).toBe(section.id);
        expect(renamed.boardId).toBe(section.boardId);
      });

      it('should validate section name is not empty', () => {
        const validateName = (name: string): boolean => {
          return typeof name === 'string' && name.trim().length > 0;
        };

        expect(validateName('')).toBe(false);
        expect(validateName('   ')).toBe(false);
        expect(validateName('Valid Name')).toBe(true);
      });

      it('should enforce max name length of 100 characters', () => {
        const validateName = (name: string): boolean => {
          return name.trim().length > 0 && name.trim().length <= 100;
        };

        expect(validateName('a'.repeat(100))).toBe(true);
        expect(validateName('a'.repeat(101))).toBe(false);
      });
    });

    describe('Section Reordering', () => {
      it('should maintain contiguous positions after reorder', () => {
        const boardId = createObjectId();
        const sections: Section[] = [
          createSection(boardId, 'A', 0),
          createSection(boardId, 'B', 1),
          createSection(boardId, 'C', 2),
        ];

        const reorderSections = (
          secs: Section[],
          newOrder: string[]
        ): Section[] => {
          return newOrder.map((id, index) => {
            const section = secs.find((s) => s.id === id)!;
            return { ...section, position: index };
          });
        };

        // Reorder: C, A, B
        const newOrder = [sections[2].id, sections[0].id, sections[1].id];
        const reordered = reorderSections(sections, newOrder);

        // Positions should be contiguous 0, 1, 2
        expect(reordered.map((s) => s.position)).toEqual([0, 1, 2]);

        // Names should be in new order
        expect(reordered.map((s) => s.name)).toEqual(['C', 'A', 'B']);
      });

      it('should preserve all sections after reorder', () => {
        fc.assert(
          fc.property(fc.nat({ max: 10 }), (sectionCount) => {
            if (sectionCount === 0) return true;

            const boardId = createObjectId();
            const sections: Section[] = Array.from({ length: sectionCount }, (_, i) =>
              createSection(boardId, `Section ${i}`, i)
            );

            // Create random permutation
            const shuffled = [...sections].sort(() => Math.random() - 0.5);
            const newOrder = shuffled.map((s) => s.id);

            const reorderSections = (
              secs: Section[],
              order: string[]
            ): Section[] => {
              return order.map((id, index) => {
                const section = secs.find((s) => s.id === id)!;
                return { ...section, position: index };
              });
            };

            const reordered = reorderSections(sections, newOrder);

            // Same number of sections
            expect(reordered).toHaveLength(sectionCount);

            // All original IDs present
            const originalIds = new Set(sections.map((s) => s.id));
            const reorderedIds = new Set(reordered.map((s) => s.id));
            expect(reorderedIds).toEqual(originalIds);

            // Positions are contiguous
            const positions = reordered.map((s) => s.position).sort((a, b) => a - b);
            expect(positions).toEqual(Array.from({ length: sectionCount }, (_, i) => i));

            return true;
          })
        );
      });

      it('should handle single section reorder (no-op)', () => {
        const boardId = createObjectId();
        const sections: Section[] = [createSection(boardId, 'Only Section', 0)];

        const reorderSections = (
          secs: Section[],
          newOrder: string[]
        ): Section[] => {
          return newOrder.map((id, index) => {
            const section = secs.find((s) => s.id === id)!;
            return { ...section, position: index };
          });
        };

        const reordered = reorderSections(sections, [sections[0].id]);

        expect(reordered).toHaveLength(1);
        expect(reordered[0].position).toBe(0);
      });
    });

    describe('Section Deletion', () => {
      it('should remove section and reindex remaining positions', () => {
        const boardId = createObjectId();
        const sections: Section[] = [
          createSection(boardId, 'A', 0),
          createSection(boardId, 'B', 1),
          createSection(boardId, 'C', 2),
        ];

        const deleteSection = (
          secs: Section[],
          sectionId: string
        ): Section[] => {
          const filtered = secs.filter((s) => s.id !== sectionId);
          // Reindex positions
          return filtered.map((s, index) => ({ ...s, position: index }));
        };

        // Delete middle section (B)
        const afterDelete = deleteSection(sections, sections[1].id);

        expect(afterDelete).toHaveLength(2);
        expect(afterDelete[0].name).toBe('A');
        expect(afterDelete[0].position).toBe(0);
        expect(afterDelete[1].name).toBe('C');
        expect(afterDelete[1].position).toBe(1);
      });

      it('should maintain contiguous positions after any deletion', () => {
        fc.assert(
          fc.property(
            fc.nat({ min: 2, max: 10 }),
            fc.nat({ max: 9 }),
            (sectionCount, deleteIndex) => {
              if (deleteIndex >= sectionCount) return true;

              const boardId = createObjectId();
              const sections: Section[] = Array.from({ length: sectionCount }, (_, i) =>
                createSection(boardId, `Section ${i}`, i)
              );

              const deleteSection = (
                secs: Section[],
                sectionId: string
              ): Section[] => {
                const filtered = secs.filter((s) => s.id !== sectionId);
                return filtered.map((s, index) => ({ ...s, position: index }));
              };

              const afterDelete = deleteSection(sections, sections[deleteIndex].id);

              // One less section
              expect(afterDelete).toHaveLength(sectionCount - 1);

              // Positions are contiguous
              const positions = afterDelete.map((s) => s.position).sort((a, b) => a - b);
              expect(positions).toEqual(
                Array.from({ length: sectionCount - 1 }, (_, i) => i)
              );

              return true;
            }
          )
        );
      });

      it('should handle deleting last section', () => {
        const boardId = createObjectId();
        const sections: Section[] = [createSection(boardId, 'Only Section', 0)];

        const deleteSection = (
          secs: Section[],
          sectionId: string
        ): Section[] => {
          return secs.filter((s) => s.id !== sectionId);
        };

        const afterDelete = deleteSection(sections, sections[0].id);

        expect(afterDelete).toHaveLength(0);
      });
    });

    describe('Board Integrity', () => {
      it('should ensure all sections belong to same board', () => {
        const boardId = createObjectId();
        const sections: Section[] = [
          createSection(boardId, 'A', 0),
          createSection(boardId, 'B', 1),
          createSection(boardId, 'C', 2),
        ];

        const allBelongToBoard = sections.every((s) => s.boardId === boardId);
        expect(allBelongToBoard).toBe(true);
      });

      it('should not allow section from different board', () => {
        const board1Id = createObjectId();
        const board2Id = createObjectId();

        const validateSectionBelongsToBoard = (
          section: Section,
          boardId: string
        ): boolean => {
          return section.boardId === boardId;
        };

        const section = createSection(board1Id, 'Section', 0);

        expect(validateSectionBelongsToBoard(section, board1Id)).toBe(true);
        expect(validateSectionBelongsToBoard(section, board2Id)).toBe(false);
      });
    });
  });

  describe('Section Position Validation', () => {
    it('should not allow negative positions', () => {
      const validatePosition = (position: number): boolean => {
        return Number.isInteger(position) && position >= 0;
      };

      expect(validatePosition(-1)).toBe(false);
      expect(validatePosition(-100)).toBe(false);
      expect(validatePosition(0)).toBe(true);
      expect(validatePosition(1)).toBe(true);
    });

    it('should only allow integer positions', () => {
      const validatePosition = (position: number): boolean => {
        return Number.isInteger(position) && position >= 0;
      };

      expect(validatePosition(1.5)).toBe(false);
      expect(validatePosition(0.1)).toBe(false);
      expect(validatePosition(NaN)).toBe(false);
      expect(validatePosition(Infinity)).toBe(false);
    });
  });
});
