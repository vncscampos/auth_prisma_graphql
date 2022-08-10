import { User } from './User';
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class Token {
    @Field()
    user: User

    @Field()
    token: string;
}