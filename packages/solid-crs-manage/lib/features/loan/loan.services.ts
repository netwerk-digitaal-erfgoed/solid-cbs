import { LoanRequest } from '@netwerk-digitaal-erfgoed/solid-crs-core';

/**
 * Sends a new LoanRequest as LDN to a heritage institution
 *
 * @param loanRequest the loanRequest to create / send
 * @returns the given loanRequest when creation was successful
 */
export const createRequest = async (loanRequest: LoanRequest): Promise<LoanRequest> => {

  // eslint-disable-next-line no-console
  console.log('Creating Request');

  return loanRequest;

};

/**
 * Loads and returns all incoming loan requests for a heritage institution
 */
export const loadRequests = async (): Promise<LoanRequest[]> => {

  // eslint-disable-next-line no-console
  console.log('Loading Requests');

  return [];

};

/**
 * Sends the original request with { accepted: true } to the requesting institution's inbox
 * to let them know the request has been accepted.
 * This also changes the request in the inbox of the receiving institution to contain { accepted: true }
 *
 * @param loanRequest the loanRequest to be accepted
 * @returns the original loan request on success
 */
export const acceptRequest = async (loanRequest: LoanRequest): Promise<LoanRequest> => {

  // eslint-disable-next-line no-console
  console.log('Accept Request');

  return loanRequest;

};

/**
 * Sends the original request with { accepted: false } to the requesting institution's inbox
 * to let them know the request has been rejected.
 * This also changes the request in the inbox of the receiving institution to contain { accepted: false }
 *
 * @param loanRequest the loanRequest to be rejected
 * @returns the original loan request on success
 */
export const rejectRequest = async (loanRequest: LoanRequest): Promise<LoanRequest> => {

  // eslint-disable-next-line no-console
  console.log('Reject Request');

  return loanRequest;

};
