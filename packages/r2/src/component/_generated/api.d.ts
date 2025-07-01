/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as lib from "../lib.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  lib: typeof lib;
}>;
export type Mounts = {
  lib: {
    deleteMetadata: FunctionReference<
      "mutation",
      "public",
      { bucket: string; key: string },
      null
    >;
    deleteObject: FunctionReference<
      "mutation",
      "public",
      {
        accessKeyId: string;
        bucket: string;
        endpoint: string;
        key: string;
        secretAccessKey: string;
      },
      null
    >;
    deleteR2Object: FunctionReference<
      "action",
      "public",
      {
        accessKeyId: string;
        bucket: string;
        endpoint: string;
        key: string;
        secretAccessKey: string;
      },
      null
    >;
    getMetadata: FunctionReference<
      "query",
      "public",
      {
        accessKeyId: string;
        bucket: string;
        endpoint: string;
        key: string;
        secretAccessKey: string;
      },
      {
        bucket: string;
        bucketLink: string;
        contentType?: string;
        key: string;
        lastModified: string;
        link: string;
        sha256?: string;
        size?: number;
        url: string;
      } | null
    >;
    listMetadata: FunctionReference<
      "query",
      "public",
      {
        accessKeyId: string;
        bucket: string;
        cursor?: string;
        endpoint: string;
        limit?: number;
        secretAccessKey: string;
      },
      {
        continueCursor: string;
        isDone: boolean;
        page: Array<{
          bucket: string;
          bucketLink: string;
          contentType?: string;
          key: string;
          lastModified: string;
          link: string;
          sha256?: string;
          size?: number;
          url: string;
        }>;
        pageStatus?: null | "SplitRecommended" | "SplitRequired";
        splitCursor?: null | string;
      }
    >;
    store: FunctionReference<
      "action",
      "public",
      {
        accessKeyId: string;
        bucket: string;
        endpoint: string;
        secretAccessKey: string;
        url: string;
      },
      any
    >;
    syncMetadata: FunctionReference<
      "action",
      "public",
      {
        accessKeyId: string;
        bucket: string;
        endpoint: string;
        key: string;
        onComplete?: string;
        secretAccessKey: string;
      },
      null
    >;
    upsertMetadata: FunctionReference<
      "mutation",
      "public",
      {
        bucket: string;
        contentType?: string;
        key: string;
        lastModified: string;
        link: string;
        sha256?: string;
        size?: number;
      },
      { isNew: boolean }
    >;
  };
};
// For now fullApiWithMounts is only fullApi which provides
// jump-to-definition in component client code.
// Use Mounts for the same type without the inference.
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  actionRetrier: {
    public: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { runId: string },
        boolean
      >;
      cleanup: FunctionReference<
        "mutation",
        "internal",
        { runId: string },
        any
      >;
      start: FunctionReference<
        "mutation",
        "internal",
        {
          functionArgs: any;
          functionHandle: string;
          options: {
            base: number;
            initialBackoffMs: number;
            logLevel: "DEBUG" | "INFO" | "WARN" | "ERROR";
            maxFailures: number;
            onComplete?: string;
          };
        },
        string
      >;
      status: FunctionReference<
        "query",
        "internal",
        { runId: string },
        | { type: "inProgress" }
        | {
            result:
              | { returnValue: any; type: "success" }
              | { error: string; type: "failed" }
              | { type: "canceled" };
            type: "completed";
          }
      >;
    };
  };
};
