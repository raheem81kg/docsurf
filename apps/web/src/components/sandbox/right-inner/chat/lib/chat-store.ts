import { nanoid } from "nanoid"
import { create } from "zustand"
export interface UploadedFile {
    key: string
    fileName: string
    fileType: string
    fileSize: number
    uploadedAt: number
}

interface ChatState {
    threadId: string | undefined
    uploadedFiles: UploadedFile[]
    rerenderTrigger: string
    lastProcessedDataIndex: number
    shouldUpdateQuery: boolean
    skipNextDataCheck: boolean
    attachedStreamIds: Record<string, string>
    pendingStreams: Record<string, boolean>
    targetFromMessageId: string | undefined
    targetMode: "normal" | "edit" | "retry"
    uploading: boolean
}

interface ChatActions {
    setThreadId: (threadId: string | undefined) => void
    setUploadedFiles: (files: UploadedFile[]) => void
    addUploadedFile: (file: UploadedFile) => void
    removeUploadedFile: (key: string) => void
    setLastProcessedDataIndex: (index: number) => void
    setShouldUpdateQuery: (should: boolean) => void
    setSkipNextDataCheck: (skip: boolean) => void
    resetChat: () => void
    triggerRerender: () => void
    setAttachedStreamId: (threadId: string, streamId: string) => void
    setPendingStream: (threadId: string, pending: boolean) => void
    setTargetFromMessageId: (messageId: string | undefined) => void
    setTargetMode: (mode: "normal" | "edit" | "retry") => void
    setUploading: (uploading: boolean) => void
    setRerenderTrigger: (rerenderTrigger: string) => void
}

const initialState: ChatState = {
    threadId: undefined,
    uploadedFiles: [],
    rerenderTrigger: nanoid(),
    lastProcessedDataIndex: -1,
    shouldUpdateQuery: false,
    skipNextDataCheck: true,
    attachedStreamIds: {},
    pendingStreams: {},
    targetFromMessageId: undefined,
    targetMode: "normal",
    uploading: false
}

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
    ...initialState,

    setThreadId: (threadId) => set({ threadId }),
    setUploadedFiles: (uploadedFiles) => set({ uploadedFiles }),
    addUploadedFile: (file) =>
        set((state) => ({
            uploadedFiles: [...state.uploadedFiles, file]
        })),
    removeUploadedFile: (key) =>
        set((state) => ({
            uploadedFiles: state.uploadedFiles.filter((f) => f.key !== key)
        })),
    setLastProcessedDataIndex: (lastProcessedDataIndex) => set({ lastProcessedDataIndex }),
    setShouldUpdateQuery: (shouldUpdateQuery) => set({ shouldUpdateQuery }),
    setSkipNextDataCheck: (skipNextDataCheck) => set({ skipNextDataCheck }),
    setUploading: (uploading) => set({ uploading }),
    setRerenderTrigger: (rerenderTrigger) => set({ rerenderTrigger }),
    resetChat: () => {
        set({
            ...initialState,
            rerenderTrigger: nanoid(),
            attachedStreamIds: {},
            targetFromMessageId: undefined,
            lastProcessedDataIndex: -1,
            skipNextDataCheck: true,
            targetMode: "normal",
            threadId: undefined
        })
    },

    triggerRerender: () => {
        set({ rerenderTrigger: nanoid() })
    },

    setAttachedStreamId: (threadId, streamId) => {
        if (!threadId) return
        set((state) => ({
            attachedStreamIds: {
                ...state.attachedStreamIds,
                [threadId]: streamId
            }
        }))
    },

    setPendingStream: (threadId, pending) => {
        if (!threadId) return
        set((state) => ({
            pendingStreams: {
                ...state.pendingStreams,
                [threadId]: pending
            }
        }))
    },

    setTargetFromMessageId: (messageId) => set({ targetFromMessageId: messageId }),

    setTargetMode: (mode) => set({ targetMode: mode })
}))
