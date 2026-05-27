import { type DriftReport } from "./drift.js";
export interface RunnerEnv {
    inputs: Record<string, string | undefined>;
    GITHUB_OUTPUT?: string;
    GITHUB_EVENT_NAME?: string;
    GITHUB_REPOSITORY?: string;
    GITHUB_EVENT_PATH?: string;
    readFile?: (path: string) => string;
    readDir?: (path: string) => string[];
    isFile?: (path: string) => boolean;
    exists?: (path: string) => boolean;
    writeFile?: (path: string, content: string) => void;
    postComment?: (args: {
        token: string;
        repo: string;
        issueNumber: number;
        body: string;
    }) => Promise<void>;
    write?: (line: string) => void;
}
export interface RunnerResult {
    exitCode: 0 | 1;
    report: DriftReport;
    baselineUpdated: boolean;
    commentPosted: boolean;
    reason?: string;
}
export declare function run(env: RunnerEnv): Promise<RunnerResult>;
