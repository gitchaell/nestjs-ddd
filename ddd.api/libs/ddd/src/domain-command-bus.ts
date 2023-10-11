import { Injectable, Type } from '@nestjs/common'
import { ModuleRef } from '@nestjs/core'
import 'reflect-metadata'
import {
	DOMAIN_COMMAND_HANDLER_METADATA,
	DOMAIN_COMMAND_METADATA,
} from './decorators/constants'
import { CommandHandlerNotFoundException } from './exceptions'
import { DefaultCommandPubSubHelper } from './helpers'
import { InvalidCommandHandlerException } from './index'
import { CommandMetadata } from './core/interfaces'
import {
	ICommand,
	ICommandBus,
	ICommandHandler,
	ICommandPublisher,
} from './core/interfaces/index'
import { ObservableBus } from './utils/observable-bus'

export type CommandHandlerType = Type<ICommandHandler<ICommand>>

@Injectable()
export class DomainCommandBus<CommandBase extends ICommand = ICommand>
	extends ObservableBus<CommandBase>
	implements ICommandBus<CommandBase>
{
	private handlers = new Map<string, ICommandHandler<CommandBase>>()
	private _publisher: ICommandPublisher<CommandBase>

	constructor(private readonly moduleRef: ModuleRef) {
		super()
		this.useDefaultPublisher()
	}

	get publisher(): ICommandPublisher<CommandBase> {
		return this._publisher
	}

	set publisher(_publisher: ICommandPublisher<CommandBase>) {
		this._publisher = _publisher
	}

	execute<T extends CommandBase, R = any>(command: T): Promise<R> {
		const commandId = this.getCommandId(command)
		const handler = this.handlers.get(commandId)
		if (!handler) {
			throw new CommandHandlerNotFoundException(commandId)
		}
		this._publisher.publish(command)
		return handler.execute(command)
	}

	bind<T extends CommandBase>(handler: ICommandHandler<T>, id: string) {
		this.handlers.set(id, handler)
	}

	register(handlers: CommandHandlerType[] = []) {
		handlers.forEach(handler => this.registerHandler(handler))
	}

	protected registerHandler(handler: CommandHandlerType) {
		const instance = this.moduleRef.get(handler, { strict: false })
		if (!instance) {
			return
		}
		const target = this.reflectCommandId(handler)
		if (!target) {
			throw new InvalidCommandHandlerException()
		}
		this.bind(instance as ICommandHandler<CommandBase>, target)
	}

	private getCommandId(command: CommandBase): string {
		const { constructor: commandType } = Object.getPrototypeOf(command)
		const commandMetadata: CommandMetadata = Reflect.getMetadata(
			DOMAIN_COMMAND_METADATA,
			commandType,
		)
		if (!commandMetadata) {
			throw new CommandHandlerNotFoundException(commandType.name)
		}

		return commandMetadata.id
	}

	private reflectCommandId(handler: CommandHandlerType): string | undefined {
		const command: Type<ICommand> = Reflect.getMetadata(
			DOMAIN_COMMAND_HANDLER_METADATA,
			handler,
		)
		const commandMetadata: CommandMetadata = Reflect.getMetadata(
			DOMAIN_COMMAND_METADATA,
			command,
		)
		return commandMetadata.id
	}

	private useDefaultPublisher() {
		this._publisher = new DefaultCommandPubSubHelper<CommandBase>(this.subject$)
	}
}
