// Modified from https://github.com/hamflx/prosemirror-diff/blob/master/src/diff.js

import { Node, Fragment, Schema, type Mark } from "@tiptap/pm/model";
import { diff_match_patch } from "diff-match-patch";

export const DiffType = {
   Unchanged: 0,
   Deleted: -1,
   Inserted: 1,
};

export const patchDocumentNode = (schema: Schema, oldNode: Node, newNode: Node): Node => {
   assertNodeTypeEqual(oldNode, newNode);

   const finalLeftChildren = [];
   const finalRightChildren = [];

   const oldChildren = normalizeNodeContent(oldNode);
   const newChildren = normalizeNodeContent(newNode);
   const oldChildLen = oldChildren.length;
   const newChildLen = newChildren.length;
   const minChildLen = Math.min(oldChildLen, newChildLen);

   let left = 0;
   let right = 0;

   for (; left < minChildLen; left++) {
      const oldChild = oldChildren[left];
      const newChild = newChildren[left];
      if (!isNodeEqual(oldChild, newChild)) {
         break;
      }
      finalLeftChildren.push(...ensureArray(oldChild));
   }

   for (; right + left + 1 < minChildLen; right++) {
      const oldChild = oldChildren[oldChildLen - right - 1];
      const newChild = newChildren[newChildLen - right - 1];
      if (!isNodeEqual(oldChild, newChild)) {
         break;
      }
      finalRightChildren.unshift(...ensureArray(oldChild));
   }

   const diffOldChildren = oldChildren.slice(left, oldChildLen - right);
   const diffNewChildren = newChildren.slice(left, newChildLen - right);

   if (diffOldChildren.length && diffNewChildren.length) {
      const matchedNodes = matchNodes(schema, diffOldChildren, diffNewChildren).sort((a, b) => b.count - a.count);
      const bestMatch = matchedNodes[0];
      if (bestMatch) {
         const { oldStartIndex, newStartIndex, oldEndIndex, newEndIndex } = bestMatch;
         const oldBeforeMatchChildren = diffOldChildren.slice(0, oldStartIndex);
         const newBeforeMatchChildren = diffNewChildren.slice(0, newStartIndex);

         finalLeftChildren.push(...patchRemainNodes(schema, oldBeforeMatchChildren, newBeforeMatchChildren));
         finalLeftChildren.push(...diffOldChildren.slice(oldStartIndex, oldEndIndex));

         const oldAfterMatchChildren = diffOldChildren.slice(oldEndIndex);
         const newAfterMatchChildren = diffNewChildren.slice(newEndIndex);

         finalRightChildren.unshift(...patchRemainNodes(schema, oldAfterMatchChildren, newAfterMatchChildren));
      } else {
         finalLeftChildren.push(...patchRemainNodes(schema, diffOldChildren, diffNewChildren));
      }
   } else {
      finalLeftChildren.push(...patchRemainNodes(schema, diffOldChildren, diffNewChildren));
   }

   return createNewNode(oldNode, [...finalLeftChildren, ...finalRightChildren]);
};

const matchNodes = (
   schema: Schema,
   oldChildren: Node[],
   newChildren: Node[]
): { oldStartIndex: number; newStartIndex: number; oldEndIndex: number; newEndIndex: number; count: number }[] => {
   const matches = [];
   for (let oldStartIndex = 0; oldStartIndex < oldChildren.length; oldStartIndex++) {
      const oldStartNode = oldChildren[oldStartIndex];
      const newStartIndex = findMatchNode(newChildren, oldStartNode);

      if (newStartIndex !== -1) {
         let oldEndIndex = oldStartIndex + 1;
         let newEndIndex = newStartIndex + 1;
         for (; oldEndIndex < oldChildren.length && newEndIndex < newChildren.length; oldEndIndex++, newEndIndex++) {
            const oldEndNode = oldChildren[oldEndIndex];
            if (!isNodeEqual(newChildren[newEndIndex], oldEndNode)) {
               break;
            }
         }
         matches.push({
            oldStartIndex,
            newStartIndex,
            oldEndIndex,
            newEndIndex,
            count: newEndIndex - newStartIndex,
         });
      }
   }
   return matches;
};

const findMatchNode = (children: Node[], node: Node, startIndex = 0): number => {
   for (let i = startIndex; i < children.length; i++) {
      if (isNodeEqual(children[i], node)) {
         return i;
      }
   }
   return -1;
};

const patchRemainNodes = (schema: Schema, oldChildren: Node[], newChildren: Node[]): Node[] => {
   const finalLeftChildren = [];
   const finalRightChildren = [];
   const oldChildLen = oldChildren.length;
   const newChildLen = newChildren.length;
   let left = 0;
   let right = 0;
   while (oldChildLen - left - right > 0 && newChildLen - left - right > 0) {
      const leftOldNode = oldChildren[left];
      const leftNewNode = newChildren[left];
      const rightOldNode = oldChildren[oldChildLen - right - 1];
      const rightNewNode = newChildren[newChildLen - right - 1];
      let updateLeft = !isTextNode(leftOldNode) && matchNodeType(leftOldNode, leftNewNode);
      let updateRight = !isTextNode(rightOldNode) && matchNodeType(rightOldNode, rightNewNode);
      if (Array.isArray(leftOldNode) && Array.isArray(leftNewNode)) {
         finalLeftChildren.push(...patchTextNodes(schema, leftOldNode, leftNewNode));
         left += 1;
         continue;
      }

      if (updateLeft && updateRight) {
         const equalityLeft = computeChildEqualityFactor(leftOldNode, leftNewNode);
         const equalityRight = computeChildEqualityFactor(rightOldNode, rightNewNode);
         if (equalityLeft < equalityRight) {
            updateLeft = false;
         } else {
            updateRight = false;
         }
      }
      if (updateLeft) {
         finalLeftChildren.push(patchDocumentNode(schema, leftOldNode, leftNewNode));
         left += 1;
      } else if (updateRight) {
         finalRightChildren.unshift(patchDocumentNode(schema, rightOldNode, rightNewNode));
         right += 1;
      } else {
         // Delete and insert
         finalLeftChildren.push(createDiffNode(schema, leftOldNode, DiffType.Deleted));
         finalLeftChildren.push(createDiffNode(schema, leftNewNode, DiffType.Inserted));
         left += 1;
      }
   }

   const deleteNodeLen = oldChildLen - left - right;
   const insertNodeLen = newChildLen - left - right;
   if (deleteNodeLen) {
      finalLeftChildren.push(
         ...oldChildren
            .slice(left, left + deleteNodeLen)
            .flat()
            .map((node) => createDiffNode(schema, node, DiffType.Deleted))
      );
   }

   if (insertNodeLen) {
      finalRightChildren.unshift(
         ...newChildren
            .slice(left, left + insertNodeLen)
            .flat()
            .map((node) => createDiffNode(schema, node, DiffType.Inserted))
      );
   }

   return [...finalLeftChildren, ...finalRightChildren];
};

// Updated function to perform sentence-level diffs
export const patchTextNodes = (schema: Schema, oldNodes: Node[], newNodes: Node[]): Node[] => {
   const dmp = new diff_match_patch();

   // Concatenate the text from the text nodes
   const oldText = oldNodes.map((n: Node) => getNodeText(n) ?? "").join("");
   const newText = newNodes.map((n: Node) => getNodeText(n) ?? "").join("");

   // Tokenize the text into sentences
   const oldSentences = tokenizeSentences(oldText);
   const newSentences = tokenizeSentences(newText);

   // Map sentences to unique characters
   const { chars1, chars2, lineArray } = sentencesToChars(oldSentences, newSentences);

   // Perform the diff
   const diffs = dmp.diff_main(chars1, chars2, false);

   // Convert back to sentences
   const sentenceDiffs: [number, string[]][] = diffs.map(([type, text]: [number, string]) => {
      const sentences = text.split("").map((char) => lineArray[char.charCodeAt(0)]);
      return [type, sentences];
   });

   // Map diffs to nodes
   const res: Node[] = sentenceDiffs.flatMap(([type, sentences]) => {
      return sentences.map((sentence: string) => {
         const marks = type !== DiffType.Unchanged ? [createDiffMark(schema, type)] : [];
         return createTextNode(schema, sentence, marks);
      });
   });

   return res;
};

// Function to tokenize text into sentences
const tokenizeSentences = (text: string): string[] => {
   return text.match(/[^.!?]+[.!?]*\s*/g) || [];
};

type SentencesToCharsResult = {
   chars1: string;
   chars2: string;
   lineArray: string[];
};

// Function to map sentences to unique characters
const sentencesToChars = (oldSentences: string[], newSentences: string[]): SentencesToCharsResult => {
   const lineArray: string[] = [];
   const lineHash: Record<string, number> = {};
   let lineStart = 0;

   const chars1 = oldSentences
      .map((sentence) => {
         const line = sentence;
         if (line in lineHash) {
            return String.fromCharCode(lineHash[line]);
         }
         lineHash[line] = lineStart;
         lineArray[lineStart] = line;
         lineStart++;
         return String.fromCharCode(lineHash[line]);
      })
      .join("");

   const chars2 = newSentences
      .map((sentence) => {
         const line = sentence;
         if (line in lineHash) {
            return String.fromCharCode(lineHash[line]);
         }
         lineHash[line] = lineStart;
         lineArray[lineStart] = line;
         lineStart++;
         return String.fromCharCode(lineHash[line]);
      })
      .join("");

   return { chars1, chars2, lineArray };
};

export const computeChildEqualityFactor = (node1: Node, node2: Node): number => {
   return 0;
};

export const assertNodeTypeEqual = (node1: Node, node2: Node): void => {
   if (getNodeProperty(node1, "type") !== getNodeProperty(node2, "type")) {
      throw new Error(`node type not equal: ${node1.type} !== ${node2.type}`);
   }
};

export const ensureArray = (value: Node | Node[]): Node[] => {
   return Array.isArray(value) ? value : [value];
};

function areMarksEqual(m1: Mark[], m2: Mark[]): boolean {
   if (m1.length !== m2.length) return false;
   for (let i = 0; i < m1.length; i++) {
      if (m1[i].type.name !== m2[i].type.name) return false;
      if (JSON.stringify(m1[i].attrs) !== JSON.stringify(m2[i].attrs)) return false;
   }
   return true;
}

export const isNodeEqual = (node1: Node, node2: Node): boolean => {
   const isNode1Array = Array.isArray(node1);
   const isNode2Array = Array.isArray(node2);
   if (isNode1Array !== isNode2Array) {
      return false;
   }
   if (isNode1Array && isNode2Array) {
      const arr1 = node1 as Node[];
      const arr2 = node2 as Node[];
      return arr1.length === arr2.length && arr1.every((node, index) => isNodeEqual(node, arr2[index]));
   }

   const type1 = getNodeProperty(node1, "type");
   const type2 = getNodeProperty(node2, "type");
   if (type1 !== type2) {
      return false;
   }
   if (isTextNode(node1)) {
      const text1 = getNodeProperty(node1, "text");
      const text2 = getNodeProperty(node2, "text");
      if (text1 !== text2) {
         return false;
      }
   }
   const attrs1 = getNodeAttributes(node1);
   const attrs2 = getNodeAttributes(node2);
   const attrs = [...new Set([...Object.keys(attrs1), ...Object.keys(attrs2)])];
   for (const attr of attrs) {
      if (attrs1[attr] !== attrs2[attr]) {
         return false;
      }
   }
   const marks1 = getNodeMarks(node1);
   const marks2 = getNodeMarks(node2);
   if (!areMarksEqual(marks1, marks2)) {
      return false;
   }
   const children1 = getNodeChildren(node1);
   const children2 = getNodeChildren(node2);
   if (children1.length !== children2.length) {
      return false;
   }
   for (let i = 0; i < children1.length; i++) {
      if (!isNodeEqual(children1[i], children2[i])) {
         return false;
      }
   }
   return true;
};

export const normalizeNodeContent = (node: Node): Node[] => {
   const content = getNodeChildren(node) ?? [];
   const res: Node[] = [];
   for (let i = 0; i < content.length; i++) {
      const child = content[i];
      if (isTextNode(child)) {
         const textNodes: Node[] = [];
         for (let textNode = content[i]; i < content.length && isTextNode(textNode); textNode = content[++i]) {
            textNodes.push(textNode);
         }
         i--;
         res.push(...textNodes); // flatten
      } else {
         res.push(child);
      }
   }
   return res;
};

export const getNodeProperty = (node: Node, property: string): string | undefined => {
   if (property === "type") {
      return node.type?.name;
   }
   return (node as any)[property];
};

export const getNodeAttribute = (node: Node, attribute: string): string | undefined =>
   node.attrs ? node.attrs[attribute] : undefined;

export const getNodeAttributes = (node: Node): Record<string, unknown> => (node.attrs ? node.attrs : {});

export const getNodeMarks = (node: Node): Mark[] => Array.from(node.marks ?? []);

export const getNodeChildren = (node: Node): Node[] => Array.from(node.content?.content ?? []);

export const getNodeText = (node: Node): string => node.text ?? "";

export const isTextNode = (node: Node): boolean => node.type?.name === "text";

export const matchNodeType = (node1: Node, node2: Node) =>
   node1.type?.name === node2.type?.name || (Array.isArray(node1) && Array.isArray(node2));

export const createNewNode = (oldNode: Node, children: Node[]) => {
   if (!oldNode.type) {
      throw new Error("oldNode.type is undefined");
   }
   return oldNode.type.create(oldNode.attrs, Fragment.fromArray(children), oldNode.marks);
};

export const createDiffNode = (schema: Schema, node: Node, type: number) => {
   return mapDocumentNode(node, (node) => {
      if (isTextNode(node)) {
         return createTextNode(schema, getNodeText(node), [...(node.marks || []), createDiffMark(schema, type)]);
      }
      return node;
   });
};

function mapDocumentNode(node: Node, mapper: (node: Node) => Node) {
   const children = node.content?.content?.map((child: Node) => mapDocumentNode(child, mapper)) ?? [];
   const copy = node.type.create(node.attrs, Fragment.fromArray(children), node.marks);
   return mapper(copy) || copy;
}

export const createDiffMark = (schema: Schema, type: number) => {
   if (type === DiffType.Inserted) {
      return schema.mark("diffMark", { type });
   }
   if (type === DiffType.Deleted) {
      return schema.mark("diffMark", { type });
   }
   throw new Error("type is not valid");
};

export const createTextNode = (schema: Schema, content: string, marks: Mark[] = []) => {
   return schema.text(content, marks);
};

export const diffEditor = (schema: Schema, oldDoc: Node, newDoc: Node) => {
   const oldNode = Node.fromJSON(schema, oldDoc);
   const newNode = Node.fromJSON(schema, newDoc);
   return patchDocumentNode(schema, oldNode, newNode);
};
