export type OmitIndexSignature<ObjectType> = {
		[KeyType in keyof ObjectType as string extends KeyType
			? never
			: number extends KeyType
				? never
				: symbol extends KeyType
					? never
					: KeyType]: ObjectType[KeyType];
	};
