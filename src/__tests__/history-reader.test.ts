import * as fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  decodeProjectPath,
  encodeProjectPath,
  getClaudeDir,
  readJsonlFile,
} from "../lib/history-reader.js";

// fs モジュールをモック
vi.mock("node:fs/promises");
vi.mock("node:os", () => ({
  homedir: () => "/home/testuser",
}));

describe("history-reader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getClaudeDir", () => {
    it("Claude ディレクトリのパスを返す", () => {
      expect(getClaudeDir()).toBe("/home/testuser/.claude");
    });
  });

  describe("encodeProjectPath", () => {
    it("スラッシュをハイフンに変換する", () => {
      expect(encodeProjectPath("/Users/test/projects/my-app")).toBe(
        "-Users-test-projects-my-app",
      );
    });

    it("既にハイフンが含まれるパスも正しく変換する", () => {
      expect(encodeProjectPath("/Users/test/my-project")).toBe(
        "-Users-test-my-project",
      );
    });
  });

  describe("decodeProjectPath", () => {
    it("先頭が - の場合、ハイフンをスラッシュに戻す", () => {
      expect(decodeProjectPath("-Users-test-projects-my-app")).toBe(
        "/Users/test/projects/my/app",
      );
    });

    it("先頭が - でない場合、そのまま返す", () => {
      expect(decodeProjectPath("some-path")).toBe("some-path");
    });
  });

  describe("readJsonlFile", () => {
    it("JSONL ファイルを正しくパースする", async () => {
      const mockContent = `{"id":1,"name":"test1"}
{"id":2,"name":"test2"}
{"id":3,"name":"test3"}`;

      vi.mocked(fs.readFile).mockResolvedValue(mockContent);

      const result = await readJsonlFile<{ id: number; name: string }>(
        "/path/to/file.jsonl",
      );

      expect(result).toEqual([
        { id: 1, name: "test1" },
        { id: 2, name: "test2" },
        { id: 3, name: "test3" },
      ]);
    });

    it("空のファイルの場合、空の配列を返す", async () => {
      vi.mocked(fs.readFile).mockResolvedValue("");

      const result = await readJsonlFile("/path/to/empty.jsonl");

      expect(result).toEqual([]);
    });

    it("ファイルが存在しない場合、空の配列を返す", async () => {
      const error = new Error("ENOENT") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      vi.mocked(fs.readFile).mockRejectedValue(error);

      const result = await readJsonlFile("/path/to/nonexistent.jsonl");

      expect(result).toEqual([]);
    });

    it("その他のエラーの場合、エラーをスローする", async () => {
      const error = new Error("Permission denied") as NodeJS.ErrnoException;
      error.code = "EACCES";
      vi.mocked(fs.readFile).mockRejectedValue(error);

      await expect(readJsonlFile("/path/to/file.jsonl")).rejects.toThrow(
        "Permission denied",
      );
    });
  });
});
