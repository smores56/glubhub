import React, { useState, useCallback, useEffect } from "react";
import { Member, Transaction } from "state/models";
import {
  RemoteData,
  loading,
  notSentYet,
  sending,
  resultToSubmissionState,
  loaded,
  resultToRemote,
  isLoaded
} from "state/types";
import { post, get } from "utils/request";
import { RemoteContent, SubmissionStateBox } from "components/Complex";
import { Button } from "components/Buttons";
import { simpleDateWithYearFormatter } from "utils/datetime";
import { Column } from "components/Basics";
import { Table } from "components/Table";

export const Money: React.FC<{ member: Member }> = ({ member }) => {
  const [transactions, updateTransactions] = useState<
    RemoteData<Transaction[]>
  >(loading);
  const [state, setState] = useState(notSentYet);

  const resolveTransaction = useCallback(
    async (transactionId: number, resolved: boolean) => {
      if (!isLoaded(transactions)) return;

      setState(sending);
      updateTransactions(
        loaded(
          transactions.data.map(t =>
            t.id === transactionId ? { ...t, resolved } : t
          )
        )
      );

      const url = `transactions/${transactionId}/resolve/${resolved}`;
      const update = await post(url, {});
      setState(resultToSubmissionState(update));
    },
    [transactions, setState, updateTransactions]
  );

  useEffect(() => {
    const loadTransactions = async () => {
      const result = await get<Transaction[]>(`transactions/${member.email}`);
      updateTransactions(resultToRemote(result));
    };

    loadTransactions();
  }, [member, updateTransactions]);

  return (
    <Column>
      <RemoteContent
        data={transactions}
        render={transactions => (
          <Table striped>
            <tbody>
              {transactions
                .sort((t1, t2) => t2.time - t1.time)
                .map(transaction => (
                  <TransactionRow
                    transaction={transaction}
                    resolve={resolveTransaction}
                  />
                ))}
            </tbody>
          </Table>
        )}
      />
      <SubmissionStateBox state={state} />
    </Column>
  );
};

interface TransactionRowProps {
  transaction: Transaction;
  resolve: (transactionId: number, resolved: boolean) => void;
}

const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  resolve
}) => (
  <tr className="no-bottom-border">
    <td>{simpleDateWithYearFormatter(transaction.time)}</td>
    <td>
      {transaction.type}
      {transaction.description && ` (${transaction.description})`}
    </td>
    <td>
      {transaction.amount < 0 ? (
        <span style={{ color: "green" }}>{-1 * transaction.amount}</span>
      ) : (
        <>{transaction.amount}</>
      )}
    </td>
    <td>{transaction.resolved ? "Resolved" : "Outstanding"}</td>
    <td>
      {transaction.resolved ? (
        <Button size="is-small" onClick={() => resolve(transaction.id, false)}>
          Unresolve
        </Button>
      ) : (
        <Button
          size="is-small"
          color="is-primary"
          onClick={() => resolve(transaction.id, true)}
        >
          Resolve
        </Button>
      )}
    </td>
  </tr>
);
