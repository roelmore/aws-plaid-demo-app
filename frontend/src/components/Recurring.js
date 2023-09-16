import { useState, useEffect } from 'react';
import { API, graphqlOperation, Logger } from 'aws-amplify';
import { Table, TableHead, TableRow, TableCell, TableBody, Loader, View, Button } from '@aws-amplify/ui-react';
import Transaction from './Transaction';
import { getRecurring as GetRecurring } from '../graphql/queries';

const logger = new Logger("Recurring");

export default function Recurring({ id, accounts = {} }) {

  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);

  const [nextToken, setNextToken] = useState(null);
  const [hasMorePages, setHasMorePages] = useState(false);

  const getRecurring = async () => {
    setLoading(true);
    try {
      const res = await API.graphql(graphqlOperation(GetRecurring, { id }));
      setTransactions(res.data.getRecurring.transactions);
      if (res.data.getRecurring.cursor) {
        setHasMorePages(true);
        setNextToken(res.data.getRecurring.cursor);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      logger.error('unable to get transactions', err);
    }
  }

  const handleLoadMore = async () => {
    try {
      const res = await API.graphql(graphqlOperation(GetRecurring, { id, cursor: nextToken }));
      if (res.data.getRecurring.cursor) {
        setNextToken(res.data.getRecurring.cursor);
        setHasMorePages(true);
      }
      else {
        setHasMorePages(false);
      }
      setTransactions([...transactions, ...res.data.getRecurring.transactions]);
    } catch (err) {
      logger.error('unable to get transactions', err);
    }
  }

  useEffect(() => {
    getRecurring();
  }, []);

  return (
    <View>
      <Table highlightOnHover={true} variation="striped">
        <TableHead>
          <TableRow>
            <TableCell as="th">Description</TableCell>
            <TableCell as="th">Category</TableCell>
            <TableCell as="th">Merchant</TableCell>
            <TableCell as="th">Frequency</TableCell>
            <TableCell as="th">First Date</TableCell>
            <TableCell as="th">Average Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
          <TableRow>
            <TableCell colSpan="6">
              <Loader/>
            </TableCell>
          </TableRow>
          ) : (
            transactions.length ? (
              transactions.map((transaction) => {
                return <Transaction key={transaction.stream_id} transaction={transaction} account={accounts[transaction.account_id]}/>;
              })
            ) : (
              <TableRow>
                <TableCell colSpan="6">Waiting for transaction data...</TableCell>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
      {transactions.length ? (
        <Button isDisabled={!hasMorePages} onClick={handleLoadMore} size="small" variable="primary">Load More</Button>
        ) : (
        <div/>
      )}
    </View>
  )
}
