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
