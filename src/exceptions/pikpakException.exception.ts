import { IPikPakFailureResponse } from "../interfaces/pikpakResponse.interface";

export class PikPakException extends Error {
	constructor(
		message: string,
		public details: IPikPakFailureResponse | unknown,
	) {
		super(message);
	}
}
