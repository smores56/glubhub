import React, { useState, useEffect } from "react";
import { Member, ActiveSemester } from "state/models";
import { RemoteData, loading, resultToRemote, mapLoaded } from "state/types";
import { get } from "utils/request";
import { RemoteContent } from "components/Complex";
import { roundToTwoDigits } from "utils/helpers";
import { Table } from "components/Table";

export const Semesters: React.FC<{ member: Member }> = ({ member }) => {
  const [semesters, setSemesters] = useState<RemoteData<ActiveSemester[]>>(
    loading
  );

  useEffect(() => {
    const loadSemesters = async () => {
      const url = `members/${member.email}?details=true`;
      const result = await get<{ semesters: ActiveSemester[] }>(url);
      setSemesters(mapLoaded(resultToRemote(result), x => x.semesters));
    };

    loadSemesters();
  }, [member, setSemesters]);

  return (
    <RemoteContent
      data={semesters}
      render={semesters => (
        <Table>
          <thead>
            <tr>
              <th>Semester</th>
              <th>Enrollment</th>
              <th>Section</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {semesters.map(semester => (
              <tr className="no-bottom-border">
                <td>{semester.semester}</td>
                <td>{semester.enrollment || "Inactive"}</td>
                <td>{semester.section || "Homeless"}</td>
                <td>{roundToTwoDigits(semester.grades.grade)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    />
  );
};
