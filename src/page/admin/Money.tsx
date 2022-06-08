import React, { useState, useEffect, useCallback, useContext, FormEvent } from "react";
import {
  notSentYet,
  loaded,
  resultToRemote,
  resultToSubmissionState,
  sending,
  SubmissionState,
  errorSending,
  isSending,
  isLoaded,
  failedToSend
} from "state/types";
import { Transaction, Fee, emptyTransactionBatch, Member } from "state/models";
import { useGlubRoute, GlubHubContext } from "utils/context";
import { RemoteData, loading } from "state/types";
import { get, post } from "utils/request";
import { Title, Columns, Box, Column } from "components/Basics";
import {
  MoneyTab,
  routeAdmin,
  adminMoney,
  moneyAssignDues,
  moneyAssignLateDues,
  moneyBatchTransactions
} from "state/route";
import {
  TextInput,
  numberType,
  SelectInput,
  stringType,
  InputWrapper,
  CheckboxInput
} from "components/Forms";
import ErrorBox from "components/ErrorBox";
import { BackButton, LinkButton, SubmitButton, Button } from "components/Buttons";
import { fullName } from "utils/helpers";
import { simpleDateWithYearFormatter } from "utils/datetime";
import {
  RemoteContent,
  SubmissionStateBox,
  MemberName,
  Modal,
  Sidebar
} from "components/Complex";
import { Table } from "components/Table";

export const Money: React.FC<{ tab: MoneyTab | null }> = ({ tab }) => {
  const [fees, updateFees] = useState<RemoteData<Fee[]>>(loading);
  const [feeState, setFeeState] = useState(notSentYet);
  const [transactions, updateTransactions] = useState<
    RemoteData<Transaction[]>
  >(loading);
  const [transactionState, setTransactionState] = useState(notSentYet);

  const resolveTransaction = useCallback(
    async (transactionId: number, resolved: boolean) => {
      if (!isLoaded(transactions)) return;

      setTransactionState(sending);
      updateTransactions(
        loaded(
          transactions.data.map(t =>
            t.id === transactionId ? { ...t, resolved } : t
          )
        )
      );

      const url = `transactions/${transactionId}/resolve/${resolved}`;
      const update = await post(url, {});

      setTransactionState(resultToSubmissionState(update));
    },
    [transactions, updateTransactions, setTransactionState]
  );

  const updateFeeAmount = useCallback(
    async (fee: Fee) => {
      if (!isLoaded(fees)) return;

      setFeeState(sending);
      updateFees(loaded(fees.data.map(f => (f.name === fee.name ? fee : f))));

      const url = `fees/${fee.name}/${fee.amount}`;
      const update = await post(url, {});

      setFeeState(resultToSubmissionState(update));
    },
    [fees, updateFees, setFeeState]
  );

  useEffect(() => {
    const loadFees = async () => {
      const fees = await get<Fee[]>(`fees`);
      updateFees(resultToRemote(fees));
    };
    const loadTransactions = async () => {
      const transactions = await get<Transaction[]>(`transactions`);
      updateTransactions(resultToRemote(transactions));
    };

    loadFees();
    loadTransactions();
  }, []);

  return (
    <div>
      <Title>Dues</Title>
      <Columns>
        <Column>
          <Box>
            <RemoteContent
              data={fees}
              render={fees => (
                <div>
                  {fees.map(fee => (
                    <SingleFee fee={fee} update={updateFeeAmount} />
                  ))}
                </div>
              )}
            />
            <SubmissionStateBox state={feeState} />
          </Box>
        </Column>
        <Column>
          <ul>
            <MoneyActionButton tab={moneyAssignDues} />
            <MoneyActionButton tab={moneyAssignLateDues} />
            <MoneyActionButton tab={moneyBatchTransactions} />
          </ul>
        </Column>
      </Columns>
      <Title>Transactions</Title>
      <Box>
        <RemoteContent
          data={transactions}
          render={transactions => (
            <TransactionTable
              transactions={transactions}
              state={transactionState}
              resolve={resolveTransaction}
            />
          )}
        />
      </Box>
      <TabContent tab={tab} />
    </div>
  );
};

const TabContent: React.FC<{ tab: MoneyTab | null }> = ({ tab }) => {
  switch (tab?.route) {
    case "assign-dues":
      return <AssignDuesModal />;

    case "assign-late-dues":
      return <AssignLateDuesModal />;

    case "batch-transactions":
      return <BatchTransactions />;

    default:
      return <></>;
  }
};

const MoneyActionButton: React.FC<{ tab: MoneyTab }> = ({ tab }) => {
  const { replaceRoute } = useGlubRoute();

  return (
    <li style={{ marginBottom: "10px" }}>
      <button
        className="button is-primary"
        onClick={() => replaceRoute(routeAdmin(adminMoney(tab)))}
      >
        {tab.name}
      </button>
    </li>
  );
};

interface SingleFeeProps {
  fee: Fee;
  update: (fee: Fee) => void;
}

const SingleFee: React.FC<SingleFeeProps> = ({ fee, update }) => (
  <TextInput
    key={fee.name}
    type={numberType}
    value={fee.amount}
    onInput={amount => update({ ...fee, amount: amount || 0 })}
    horizontal
    title={fee.description}
  />
);

interface TransactionTableProps {
  transactions: Transaction[];
  state: SubmissionState;
  resolve: (transactionId: number, resolved: boolean) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  state,
  resolve
}) => (
    <>
      <Table striped fullwidth scrollable>
        <tbody>
          {transactions
            .sort((t1, t2) => t1.time - t2.time)
            .map(transaction => (
              <tr className="no-bottom-border">
                <td>{simpleDateWithYearFormatter(transaction.time)}</td>
                <td>
                  <MemberName email={transaction.member} />
                </td>
                <td>{transaction.type}</td>
                <td>{`${transaction.amount}`}</td>
                <td>{transaction.resolved ? "Resolved" : "Outstanding"}</td>
                <td>
                  <Button
                    size="is-small"
                    color={!transaction.resolved ? "is-primary" : undefined}
                    onClick={() => resolve(transaction.id, !transaction.resolved)}
                  >
                    {transaction.resolved ? "Unresolve" : "Resolve"}
                  </Button>
                </td>
                <td>{transaction.description}</td>
              </tr>
            ))}
        </tbody>
      </Table>
      <SubmissionStateBox state={state} />
    </>
  );

const BeholdThe: React.FC<{ text: string }> = ({ text }) => (
  <p style={{ marginBottom: "10px" }}>
    <h3 className="subtitle is-3">Behold the {text}</h3>
  </p>
);

const CancelButton: React.FC = () => (
  <LinkButton className="is-pulled-right" route={routeAdmin(adminMoney(null))}>
    ABORT! ABORT!
  </LinkButton>
);

const AssignDuesModal: React.FC = () => {
  const { replaceRoute } = useGlubRoute();
  const [state, setState] = useState(notSentYet);

  const assignDues = useCallback(async () => {
    setState(sending);

    const result = await post(`fees/charge_dues`, {});
    if (result.successful) {
      replaceRoute(routeAdmin(adminMoney(null)));
    } else {
      setState(errorSending(result.error));
    }
  }, [setState, replaceRoute]);

  return (
    <Modal close={() => replaceRoute(routeAdmin(adminMoney(null)))}>
      <div style={{ padding: "20px" }}>
        <Title>
          You are fixin' to assign dues to everyone{" "}
          <b>who has not yet been assigned dues this semester.</b>
        </Title>
        <BeholdThe text="power" />
        <BeholdThe text="corruption" />
        <BeholdThe text="folksy phrasing" />
        {failedToSend(state) && <ErrorBox error={state.error} />}
        <br />
        <Button
          element="a"
          color="is-primary"
          className="is-pulled-left"
          loading={isSending(state)}
          onClick={assignDues}
        >
          Dolla dolla bill, y'all
        </Button>
        <CancelButton />
        <br />
      </div>
    </Modal>
  );
};

const AssignLateDuesModal: React.FC = () => {
  const { replaceRoute } = useGlubRoute();
  const [state, setState] = useState(notSentYet);

  const assignLateDues = useCallback(async () => {
    setState(sending);

    const result = await post(`fees/charge_late_dues`, {});
    if (result.successful) {
      replaceRoute(routeAdmin(adminMoney(null)));
    } else {
      setState(errorSending(result.error));
    }
  }, [setState, replaceRoute]);

  return (
    <Modal close={() => replaceRoute(routeAdmin(adminMoney(null)))}>
      <div style={{ padding: "20px" }}>
        <Title>
          You are fixin' to assign late dues to everyone{" "}
          <b>who has not yet paid their dues this semester.</b>
        </Title>
        <BeholdThe text="power" />
        <BeholdThe text="corruption" />
        <BeholdThe text="folksy phrasing" />
        {failedToSend(state) && <ErrorBox error={state.error} />}
        <br />
        <Button
          element="a"
          color="is-primary"
          className="is-pulled-left"
          loading={isSending(state)}
          onClick={assignLateDues}
        >
          Dolla dolla bill, y'all
        </Button>
        <CancelButton />
        <br />
      </div>
    </Modal>
  );
};

const BatchTransactions: React.FC = () => {
  const { members, info } = useContext(GlubHubContext);
  const { replaceRoute } = useGlubRoute();

  const [batch, updateBatch] = useState(emptyTransactionBatch);
  const [state, setState] = useState(notSentYet);

  const closeSidebar = useCallback(
    () => replaceRoute(routeAdmin(adminMoney(null))),
    [replaceRoute]
  );

  const toggleMember = useCallback(
    (email: string) => {
      if (batch.members.includes(email)) {
        updateBatch({
          ...batch,
          members: batch.members.filter(m => m !== email)
        });
      } else {
        updateBatch({ ...batch, members: [...batch.members, email] });
      }
    },
    [batch, updateBatch]
  );

  const sendBatch = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    setState(sending);

    const result = await post(`fees/create_batch`, batch);
    if (result.successful) {
      closeSidebar();
    } else {
      setState(errorSending(result.error));
    }
  }, [setState, batch, closeSidebar]);

  return (
    <Sidebar
      data={loaded({})}
      close={closeSidebar}
      render={() => (
        <form onSubmit={sendBatch}>
          <BackButton content="cancel" click={closeSidebar} />
          <Title centered>Batch Transactions</Title>
          <SelectInput
            type={stringType}
            values={info?.transactionTypes || []}
            selected={batch.type}
            onInput={type => updateBatch({ ...batch, type })}
            title="What's its persuasion?"
          />
          <TextInput
            type={stringType}
            value={batch.description}
            onInput={description => updateBatch({ ...batch, description })}
            title="What's it for?"
            placeholder="Scotland Trip 2029"
            required
          />
          <TextInput
            type={numberType}
            value={batch.amount}
            onInput={amount => updateBatch({ ...batch, amount })}
            title="How many doll hairs?"
            prefix="$"
            placeholder="420"
            required
          />
          <InputWrapper title="Whomdst">
            <Box>
              <ul style={{ columnCount: 3, columnGap: "20px" }}>
                {members.map(member => (
                  <MemberBatchRow
                    member={member}
                    selected={batch.members.includes(member.email)}
                    select={toggleMember}
                  />
                ))}
              </ul>
            </Box>
          </InputWrapper>
          <br />
          <SubmitButton
            color="is-primary"
            loading={isSending(state)}
          >
            My mind on my money and my money on my mind
          </SubmitButton>
          {failedToSend(state) && <ErrorBox error={state.error} />}
        </form>
      )}
    />
  );
};

interface MemberBatchRowProps {
  member: Member;
  selected: boolean;
  select: (email: string) => void;
}

const MemberBatchRow: React.FC<MemberBatchRowProps> = ({
  member,
  selected,
  select
}) => (
    <li>
      <CheckboxInput
        content={fullName(member)}
        checked={selected}
        onChange={() => select(member.email)}
      />
    </li>
  );
