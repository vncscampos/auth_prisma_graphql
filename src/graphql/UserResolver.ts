import { Context } from "./../context";
import {
  Arg,
  Ctx,
  Field,
  InputType,
  Mutation,
  Query,
  Resolver,
} from "type-graphql";
import { User } from "../entities/User";
import { hash, compare } from "bcryptjs";
import { v4 as uuid } from "uuid";
import { Token } from "../entities/Token";

@InputType()
class UserInputData {
  @Field()
  email: string;

  @Field()
  password: string;
}

@Resolver()
export class UserResolver {
  @Query((returns) => User, { nullable: true })
  async privateInfo(
    @Arg("token") token: string,
    @Ctx() ctx: Context
  ): Promise<User | null> {
    const dbToken = await ctx.prisma.tokens.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!dbToken) return null;

    const { user } = dbToken;

    return user;
  }

  @Mutation((returns) => User)
  async signUp(
    @Arg("data") data: UserInputData,
    @Ctx() ctx: Context
  ): Promise<User> {
    const hashPass = await hash(data.password, 8);

    return ctx.prisma.users.create({ data: { ...data, password: hashPass } });
  }

  @Mutation((returns) => Token)
  async signIn(
    @Arg("data") data: UserInputData,
    @Ctx() ctx: Context
  ): Promise<User & { token: string } | null> {
    const user = await ctx.prisma.users.findUnique({
      where: { email: data.email },
    });

    if (!user) return null;

    const validation = await compare(data.password, user.password);

    if (!validation) return null;

    const newToken = uuid();

    const token = await ctx.prisma.tokens.create({
      data: { token: newToken, user: { connect: { id: user.id } } },
    });

    return {...user, token: token.token};
  }
}
