namespace NodeJS {
  interface ProcessEnv {
    PACKAGE_VERSION: string;
    OPENAI_API_KEY: string;
    OPENAI_MAX_RETRIES?: string;
    OPENAI_API_TIMEOUT?: string;
    DEFAULT_OUTPUT_DIR?: string;
    MAX_FILE_SIZE_MB?: string;
    ENABLE_FILE_OUTPUT?: string;
    KEEP_FILES_DAYS?: string;
  }
}
