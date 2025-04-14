interface SessionProps {
    session: Session | null;
}

interface AttendanceRecord {
    date: Date;
    clockIn: Date;
    clockOut: Date;
}

type LocalStorageStamp = {
    stamp_id: string;
    work_now: boolean;
};

interface Task {
    id: number;
    title: string;
    description: string;
    progress: number;
    deadline: Date;
    status: String;
    manager_id: number;
    assigner_id: number;
}
