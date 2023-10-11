import { Subject } from 'rxjs'
import {
	IDomainEvent,
	IDomainEventPublisher,
	IMessageSource,
} from '../core/interfaces'

export class DefaultPubSubHelper<DomainEventBase extends IDomainEvent>
	implements
		IDomainEventPublisher<DomainEventBase>,
		IMessageSource<DomainEventBase>
{
	constructor(private subject$: Subject<DomainEventBase>) {}

	publish<T extends DomainEventBase>(event: T) {
		this.subject$.next(event)
	}

	bridgeEventsTo<T extends DomainEventBase>(subject: Subject<T>) {
		this.subject$ = subject
	}
}
