import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  Meteor.methods({

  })
});

/* Server Side Array V.1

School 1:
{
	Class A: (Ex: MYP Chemistry) {
		Teacher A: (Ex: Mr. Bob) {
			Homework 1: { (Ex: Finish polyatomic ions worksheet)
				Due Date: (Ex: 8/9/2016 16:00 [Time can be blank])
				Aliases: { 
					(Ex: Polyatomic Ions WS, Do polyatomic ions)
				}
				Requirements: { [Can be blank]
					(Ex: Questions 1-7)
				}
				Submitted: (Ex: beans.cool1337@bloomfield.org) [Person who submitted it]
				Confirmations: {
					(Ex: yang.eric@bloomfield.org, boberson.bob@bloomfield.org)
				}
				Reports: {
					(Ex: moss.anthony@bloomfield.org)
				}
				Attachments: {
					Doc 1: 
						(Ex: WS.doc, agarwal.arav@bloomfield.org)
				}
				Done: {
					(Ex: qalieh.yaman@bloomfield.org)
				}
			}
				
			Homework 2: {
				Due Date:
				Aliases:{}
				Requirements: {}
				Submitted:
				Confirmations: {}
				Reports: {}
				Attachments: {}
				Done: {}
			}
		}

		Teacher	B: {
			Homework 1: {
				Due Date:
				Aliases:{}
				Requirements: {}
				Submitted:
				Confirmations: {}
				Reports: {}
				Attachments: {}
				Done: {}
			}
		}
	}

	Class B: (Ex: Matematicas) {
		Teacher	A: {
			Homework 1: {
				Due Date:
				Aliases:{}
				Requirements: {}
				Submitted:
				Confirmations: {}
				Reports: {}
				Attachments: {}
				Done: {}
			}
		}
	}
}

*/
